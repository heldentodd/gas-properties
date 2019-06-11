// Copyright 2019, University of Colorado Boulder

/**
 * HistogramsModel is a sub-model in the Energy screen, responsible for the Speed and Kinetic Energy histograms.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const BooleanProperty = require( 'AXON/BooleanProperty' );
  const Emitter = require( 'AXON/Emitter' );
  const gasProperties = require( 'GAS_PROPERTIES/gasProperties' );
  const GasPropertiesConstants = require( 'GAS_PROPERTIES/common/GasPropertiesConstants' );
  const NumberProperty = require( 'AXON/NumberProperty' );
  const ObservableArray = require( 'AXON/ObservableArray' );
  const ParticleSystem = require( 'GAS_PROPERTIES/common/model/ParticleSystem' );
  const Property = require( 'AXON/Property' );

  class HistogramsModel {

    /**
     * @param {ParticleSystem} particleSystem
     * @param {BooleanProperty} isPlayingProperty
     * @param {number} samplePeriod - data is averaged over this period, in ps
     */
    constructor( particleSystem, isPlayingProperty, samplePeriod ) {
      assert && assert( particleSystem instanceof ParticleSystem, `invalid particleSystem: ${particleSystem}` );
      assert && assert( isPlayingProperty instanceof BooleanProperty, `invalid isPlayingProperty: ${isPlayingProperty}` );
      assert && assert( typeof samplePeriod === 'number' && samplePeriod > 0,
        `invalid samplePeriod: ${samplePeriod}` );

      // @private
      this.particleSystem = particleSystem;
      this.isPlayingProperty = isPlayingProperty;
      this.samplePeriod = samplePeriod;

      // @public (read-only) values chosen in https://github.com/phetsims/gas-properties/issues/52
      this.numberOfBins = 19;  // number of bins, common to both histograms
      this.speedBinWidth = 170; // bin width for the Speed histogram, in pm/ps
      this.kineticEnergyBinWidth = 8E5; // bin width for the Kinetic Energy histogram, in AMU * pm^2 / ps^2;

      // Initialize histograms with 0 in all bins
      const emptyBins = [];
      for ( let i = 0; i < this.numberOfBins; i++ ) {
        emptyBins[ i ] = 0;
      }

      const binCountsPropertyOptions = {
        isValidValue: value => ( Array.isArray( value ) && value.length === this.numberOfBins )
      };

      // @public (read-only) Speed bin counts
      this.heavySpeedBinCountsProperty = new Property( emptyBins, binCountsPropertyOptions );
      this.lightSpeedBinCountsProperty = new Property( emptyBins, binCountsPropertyOptions );
      this.allSpeedBinCountsProperty = new Property( emptyBins, binCountsPropertyOptions );

      // @public (read-only) Kinetic Energy bin counts
      this.heavyKineticEnergyBinCountsProperty = new Property( emptyBins, binCountsPropertyOptions );
      this.lightKineticEnergyBinCountsProperty = new Property( emptyBins, binCountsPropertyOptions );
      this.allKineticEnergyBinCountsProperty = new Property( emptyBins, binCountsPropertyOptions );

      // @public (read-only) the y-axis scale for all histograms
      this.yScaleProperty = new NumberProperty( GasPropertiesConstants.HISTOGRAM_LINE_SPACING, {
        isValidValue: value => ( value >= GasPropertiesConstants.HISTOGRAM_LINE_SPACING )
      } );

      // @public emits when the bin counts have been updated
      this.binCountsUpdatedEmitter = new Emitter();

      // @private Speed samples
      this.heavySpeedSamples = []; // {number[][]} Speed samples for heavy particles
      this.lightSpeedSamples = []; // {number[][]} Speed samples for light particles

      // @private Kinetic Energy samples
      this.heavyKineticEnergySamples = []; // {number[][]} Kinetic Energy samples for heavy particles
      this.lightKineticEnergySamples = []; // {number[][]} Kinetic Energy samples for light particles

      // @private for measuring sample period
      this.dtAccumulator = 0;
      this.numberOfSamples = 0;

      // Clear sample data when the play state changes, so that we can update immediately if manually stepping.
      isPlayingProperty.link( isPlaying => {
        this.clearSamples();
      } );

      // If the number of particles changes while paused, sample the current state and update immediately.
      particleSystem.numberOfParticlesProperty.link( numberOfParticles => {
        if ( !isPlayingProperty.value ) {
          this.step( this.samplePeriod ); // using the sample period causes an immediate update
        }
      } );
    }

    /**
     * Resets this model.
     * @public
     */
    reset() {
      this.clearSamples();
    }

    /**
     * Clears the sample data.
     * @private
     */
    clearSamples() {

      this.dtAccumulator = 0;
      this.numberOfSamples = 0;

      // clear Speed samples
      this.heavySpeedSamples.length = 0;
      this.lightSpeedSamples.length = 0;

      // clear Kinetic Energy samples
      this.heavyKineticEnergySamples.length = 0;
      this.lightKineticEnergySamples.length = 0;
    }

    /**
     * Steps the histograms.
     * @param {number} dt - time delta, in ps
     */
    step( dt ) {
      assert && assert( typeof dt === 'number' && dt > 0, `invalid dt: ${dt}` );

      // Accumulate dt
      this.dtAccumulator += dt;

      // Takes data samples
      this.sample();

      // Update now if we've reached the end of the sample period, or if we're manually stepping
      if ( this.dtAccumulator >= this.samplePeriod || !this.isPlayingProperty.value ) {
        this.update();
      }
    }

    /**
     * Takes a data sample for histograms.
     * @private
     */
    sample() {
      assert && assert( !( this.numberOfSamples !== 0 && !this.isPlayingProperty.value ),
        'numberOfSamples should be 0 if called while the sim is paused' );

      // take a Speed sample
      this.heavySpeedSamples.push( getSpeedValues( this.particleSystem.heavyParticles ) );
      this.lightSpeedSamples.push( getSpeedValues( this.particleSystem.lightParticles ) );

      // take a Kinetic Energy sample
      this.heavyKineticEnergySamples.push( getKineticEnergyValues( this.particleSystem.heavyParticles ) );
      this.lightKineticEnergySamples.push( getKineticEnergyValues( this.particleSystem.lightParticles ) );

      this.numberOfSamples++;
    }

    /**
     * Updates the histograms using the current sample data.
     * @private
     */
    update() {
      assert && assert( !( this.numberOfSamples !== 1 && !this.isPlayingProperty.value ),
        'numberOfSamples should be 1 if called while the sim is paused' );

      // update Speed bin counts
      this.heavySpeedBinCountsProperty.value =
        samplesToBinCounts( this.heavySpeedSamples, this.numberOfBins, this.speedBinWidth );
      this.lightSpeedBinCountsProperty.value =
        samplesToBinCounts( this.lightSpeedSamples, this.numberOfBins, this.speedBinWidth );
      this.allSpeedBinCountsProperty.value =
        sumBinCounts( this.heavySpeedBinCountsProperty.value, this.lightSpeedBinCountsProperty.value );

      // update Kinetic Energy bin counts
      this.heavyKineticEnergyBinCountsProperty.value =
        samplesToBinCounts( this.heavyKineticEnergySamples, this.numberOfBins, this.kineticEnergyBinWidth );
      this.lightKineticEnergyBinCountsProperty.value =
        samplesToBinCounts( this.lightKineticEnergySamples, this.numberOfBins, this.kineticEnergyBinWidth );
      this.allKineticEnergyBinCountsProperty.value =
        sumBinCounts( this.heavyKineticEnergyBinCountsProperty.value, this.lightKineticEnergyBinCountsProperty.value );

      // Find the maximum bin count for all histograms. It's sufficient to look at the 'all' histograms.
      // This is used to determine the y-axis scale, which must be the same for both histograms.
      const maxBinCount = Math.max(
        _.max( this.allSpeedBinCountsProperty.value ),
        _.max( this.allKineticEnergyBinCountsProperty.value ) );

      // Adjust the y-axis scale to accommodate the maximum bin count.
      // Increase the y scale a bit so that there's always a little space above maxBinCount.
      // The minimum scale is determined by the spacing between horizontal lines in the histogram view.
      // We don't want to the scale to be less than one interval of the horizontal lines, so that the
      // y axis doesn't scale for small numbers of particles.
      this.yScaleProperty.value = Math.max( 1.05 * maxBinCount, GasPropertiesConstants.HISTOGRAM_LINE_SPACING );

      // Notify listeners that the bin counts have been updated.
      this.binCountsUpdatedEmitter.emit();

      // Clear sample data in preparation for the next sample period.
      this.clearSamples();
    }
  }

  /**
   * Gets the speed values for a set of particles, in pm/ps.
   * @param {ObservableArray} particles
   * @returns {number[]}
   */
  function getSpeedValues( particles ) {
    assert && assert( particles instanceof ObservableArray, `invalid particles: ${particles}` );

    const values = [];
    const array = particles.getArray(); // use raw array for performance
    for ( let i = 0; i < array.length; i++ ) {
      values.push( array[ i ].velocity.magnitude );
    }
    return values;
  }

  /**
   * Gets the kinetic energy values for a set of particles, in in AMU * pm^2 / ps^2.
   * @param {ObservableArray} particles
   * @returns {number[]}
   */
  function getKineticEnergyValues( particles ) {
    assert && assert( particles instanceof ObservableArray, `invalid particles: ${particles}` );

    const values = [];
    const array = particles.getArray(); // use raw array for performance
    for ( let i = 0; i < array.length; i++ ) {
      values.push( array[ i ].getKineticEnergy() );
    }
    return values;
  }

  /**
   * Converts a collection of samples to bin counts.
   * @param {number[][]} sampleArrays
   * @param {number} numberOfBins
   * @param {number} binWidth
   * @returns {number[]}
   */
  function samplesToBinCounts( sampleArrays, numberOfBins, binWidth ) {
    assert && assert( Array.isArray( sampleArrays ) && sampleArrays.length > 0, `invalid sampleArrays: ${sampleArrays}` );
    assert && assert( typeof numberOfBins === 'number' && numberOfBins > 0, `invalid numberOfBins: ${numberOfBins}` );
    assert && assert( typeof binWidth === 'number' && binWidth > 0, `invalid binWidth: ${binWidth}` );

    // Initialize the bins with 0 counts
    const binCounts = [];
    for ( let i = 0; i < numberOfBins; i++ ) {
      binCounts[ i ] = 0;
    }

    // Bin all of the sample data, for total binCounts
    for ( let i = 0; i < sampleArrays.length; i++ ) {
      const values = sampleArrays[ i ];
      for ( let j = 0; j < values.length; j++ ) {
        const index = Math.floor( values[ j ] / binWidth ); // bin range is [min,max)
        if ( index >= 0 && index < binCounts.length ) {
          binCounts[ index ]++;
        }
      }
    }

    // Average the bin counts
    for ( let i = 0; i < binCounts.length; i++ ) {
      assert && assert( typeof binCounts[ i ] === 'number' && binCounts[ i ] >= 0,
        `invalid binCount: ${binCounts[ i ]}` );
      binCounts[ i ] = binCounts[ i ] / sampleArrays.length;
    }

    assert && assert( binCounts.length === numberOfBins, `unexpected number of binCounts: ${binCounts.length}` );
    return binCounts;
  }

  /**
   * Sums the heavy and light bin counts to produce the bin counts for all particles.
   * @param {number[]} heavyBinCounts
   * @param {number[]} lightBinCounts
   * @returns {number[]}
   */
  function sumBinCounts( heavyBinCounts, lightBinCounts ) {
    assert && assert( Array.isArray( heavyBinCounts ), `invalid heavyBinCounts: ${heavyBinCounts}` );
    assert && assert( Array.isArray( lightBinCounts ), `invalid heavyBinCounts: ${lightBinCounts}` );
    assert && assert( heavyBinCounts.length === lightBinCounts.length, 'lengths should be the same' );

    const sumBinCounts = [];
    for ( let i = 0; i < heavyBinCounts.length; i++ ) {
      sumBinCounts[ i ] = heavyBinCounts[ i ] + lightBinCounts[ i ];
    }
    return sumBinCounts;
  }

  return gasProperties.register( 'HistogramsModel', HistogramsModel );
} );