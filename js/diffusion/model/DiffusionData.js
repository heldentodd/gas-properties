// Copyright 2019, University of Colorado Boulder

/**
 * DiffusionData is responsible for information related to one side of the container.
 * This information is displayed in the 'Data' accordion box on the 'Diffusion' screen.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const Bounds2 = require( 'DOT/Bounds2' );
  const gasProperties = require( 'GAS_PROPERTIES/gasProperties' );
  const GasPropertiesConstants = require( 'GAS_PROPERTIES/common/GasPropertiesConstants' );
  const NumberProperty = require( 'AXON/NumberProperty' );
  const ObservableArray = require( 'AXON/ObservableArray' );
  const Property = require( 'AXON/Property' );

  // constants
  const NUMBER_OF_PARTICLES_PROPERTY_OPTIONS = {
    numberType: 'Integer',
    isValidValue: value => ( value >= 0 )
  };
  const AVERAGE_TEMPERATURE_PROPERTY_OPTIONS = {
    isValidValue: value => ( value === null || ( typeof value === 'number' && value > 0 ) ),
    units: 'K'
  };

  class DiffusionData {

    /**
     * @param {Bounds2} bounds - bounds of one side of the container
     * @param {ObservableArray} particles1 - of DiffusionParticle1
     * @param {ObservableArray} particles2 - of DiffusionParticle2
     */
    constructor( bounds, particles1, particles2 ) {
      assert && assert( bounds instanceof Bounds2, `invalid bounds: ${bounds}` );
      assert && assert( particles1 instanceof ObservableArray, `invalid particles1: ${particles1}` );
      assert && assert( particles2 instanceof ObservableArray, `invalid particles2: ${particles2}` );

      // @private
      this.bounds = bounds;
      this.particles1 = particles1;
      this.particles2 = particles2;

      // @public number of DiffusionParticle1 in this side of the container
      this.numberOfParticles1Property = new NumberProperty( 0, NUMBER_OF_PARTICLES_PROPERTY_OPTIONS );

      // @public number of DiffusionParticle2 in this side of the container
      this.numberOfParticles2Property = new NumberProperty( 0, NUMBER_OF_PARTICLES_PROPERTY_OPTIONS );

      // @public {Property.<number|null>} average temperature in this side of the container, in K
      // null when there are no particles in this side of the container.
      this.averageTemperatureProperty = new Property( null, AVERAGE_TEMPERATURE_PROPERTY_OPTIONS );

      this.update();
    }

    /**
     * Updates Properties based on the contents of the particle arrays.
     * @public
     */
    update() {

      let numberOfParticles1 = 0;
      let numberOfParticles2 = 0;
      let totalKE = 0;

      // Contribution by DiffusionParticle1 species
      const array1 = this.particles1.getArray(); // use raw array for performance
      for ( let i = 0; i < array1.length; i++ ) {
        const particle = array1[ i ];
        if ( this.bounds.containsPoint( particle.location ) ) {
          numberOfParticles1++;
          totalKE += particle.getKineticEnergy();
        }
      }

      // Contribution by DiffusionParticle2 species.
      // Note that there's a wee bit of code duplication here, but it gains use some iteration efficiency.
      const array2 = this.particles2.getArray(); // use raw array for performance
      for ( let i = 0; i < array2.length; i++ ) {
        const particle = array2[ i ];
        if ( this.bounds.containsPoint( particle.location ) ) {
          numberOfParticles2++;
          totalKE += particle.getKineticEnergy();
        }
      }

      // Update number of particles
      this.numberOfParticles1Property.value = numberOfParticles1;
      this.numberOfParticles2Property.value = numberOfParticles2;

      // Update average temperature
      const totalNumberOfParticles = numberOfParticles1 + numberOfParticles2;
      if ( totalNumberOfParticles === 0 ) {
        this.averageTemperatureProperty.value = null;
      }
      else {
        assert && assert( totalKE !== 0, 'totalKE should not be zero when the container is not empty' );

        // T = (2/3)KE/k
        const averageKE = totalKE / totalNumberOfParticles;
        this.averageTemperatureProperty.value = ( 2 / 3 ) * averageKE / GasPropertiesConstants.BOLTZMANN; // K
      }
    }
  }

  return gasProperties.register( 'DiffusionData', DiffusionData );
} );