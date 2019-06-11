// Copyright 2019, University of Colorado Boulder

/**
 * Sub-model of GasPropertiesModel that is responsible for the particle system, including the N (number of particles)
 * component of the Ideal Gas Law, PV = NkT.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const BooleanProperty = require( 'AXON/BooleanProperty' );
  const Bounds2 = require( 'DOT/Bounds2' );
  const DerivedProperty = require( 'AXON/DerivedProperty' );
  const gasProperties = require( 'GAS_PROPERTIES/gasProperties' );
  const GasPropertiesConstants = require( 'GAS_PROPERTIES/common/GasPropertiesConstants' );
  const GasPropertiesContainer = require( 'GAS_PROPERTIES/common/model/GasPropertiesContainer' );
  const GasPropertiesUtils = require( 'GAS_PROPERTIES/common/GasPropertiesUtils' );
  const HeavyParticle = require( 'GAS_PROPERTIES/common/model/HeavyParticle' );
  const LightParticle = require( 'GAS_PROPERTIES/common/model/LightParticle' );
  const NumberProperty = require( 'AXON/NumberProperty' );
  const ObservableArray = require( 'AXON/ObservableArray' );
  const ParticleUtils = require( 'GAS_PROPERTIES/common/model/ParticleUtils' );
  const Vector2 = require( 'DOT/Vector2' );

  // constants

  // used to compute the initial velocity angle for particles, in radians
  const PARTICLE_DISPERSION_ANGLE = Math.PI / 2;

  class ParticleSystem {

    /**
     * @param {function:number} getInitialTemperature - gets the temperature used to compute initial velocity magnitude
     * @param {BooleanProperty} collisionsEnabledProperty - where particle-particle collisions are enabled
     * @param {Vector2} particleEntryLocation - point where the particles enter the container
     */
    constructor( getInitialTemperature, collisionsEnabledProperty, particleEntryLocation ) {
      assert && assert( typeof getInitialTemperature === 'function',
        `invalid getInitialTemperature: ${getInitialTemperature}` );
      assert && assert( collisionsEnabledProperty instanceof BooleanProperty,
        `invalid collisionsEnabledProperty: ${collisionsEnabledProperty}` );
      assert && assert( particleEntryLocation instanceof Vector2,
        `invalid particleEntryLocation: ${particleEntryLocation}` );

      // @private
      this.getInitialTemperature = getInitialTemperature;
      this.collisionsEnabledProperty = collisionsEnabledProperty;
      this.particleEntryLocation = particleEntryLocation;

      // Separate arrays are kept to optimize performance.

      // @public (read-only) {ObservableArray.<HeavyParticle>} heavy particles inside the container
      this.heavyParticles = new ObservableArray( [] );

      // @public (read-only) {ObservableArray.<LightParticle>} light particles inside the container
      this.lightParticles = new ObservableArray( [] );

      // @public (read-only) {ObservableArray.<HeavyParticle>} heavy particles outside the container
      this.heavyParticlesOutside = new ObservableArray( [] );

      // @public (read-only) {ObservableArray.<LightParticle>} light particles outside the container
      this.lightParticlesOutside = new ObservableArray( [] );

      // @public (read-only) performance optimization, for iterating over all particles inside the container
      this.insideParticleArrays = [ this.heavyParticles, this.lightParticles ];

      // @public the number of heavy particles inside the container
      this.numberOfHeavyParticlesProperty = new NumberProperty( GasPropertiesConstants.HEAVY_PARTICLES_RANGE.defaultValue, {
        numberType: 'Integer',
        range: GasPropertiesConstants.HEAVY_PARTICLES_RANGE
      } );

      // @public the number of light particles inside the container
      this.numberOfLightParticlesProperty = new NumberProperty( GasPropertiesConstants.LIGHT_PARTICLES_RANGE.defaultValue, {
        numberType: 'Integer',
        range: GasPropertiesConstants.LIGHT_PARTICLES_RANGE
      } );

      // Synchronize particle counts and arrays.
      const createHeavyParticle = ( options ) => new HeavyParticle( options );
      this.numberOfHeavyParticlesProperty.link( ( newValue, oldValue ) => {
        this.updateNumberOfParticles( newValue, oldValue, this.heavyParticles, createHeavyParticle );
        assert && assert( GasPropertiesUtils.isObservableArrayOf( this.heavyParticles, HeavyParticle ),
          'heavyParticles should contain only HeavyParticle' );
      } );
      const createLightParticle = ( options ) => new LightParticle( options );
      this.numberOfLightParticlesProperty.link( ( newValue, oldValue ) => {
        this.updateNumberOfParticles( newValue, oldValue, this.lightParticles, createLightParticle );
        assert && assert( GasPropertiesUtils.isObservableArrayOf( this.lightParticles, LightParticle ),
          'lightParticles should contain only LightParticle' );
      } );

      // @public N, the total number of particles in the container.
      this.numberOfParticlesProperty = new DerivedProperty(
        [ this.heavyParticles.lengthProperty, this.lightParticles.lengthProperty ],
        ( heavyParticlesLength, lightParticlesLength ) => heavyParticlesLength + lightParticlesLength, {
          numberType: 'Integer',
          valueType: 'number',
          isValidValue: value => value >= 0
        }
      );
    }

    /**
     * Resets the particle system.
     * @public
     */
    reset() {

      // Remove and dispose of particles
      this.numberOfHeavyParticlesProperty.reset();
      assert && assert( this.heavyParticles.lengthProperty.value === 0, 'there should be no heavyParticles' );
      this.numberOfLightParticlesProperty.reset();
      assert && assert( this.lightParticles.lengthProperty.value === 0, 'there should be no lightParticles' );
      ParticleUtils.removeAllParticles( this.heavyParticlesOutside );
      assert && assert( this.heavyParticlesOutside.lengthProperty.value === 0, 'there should be no heavyParticlesOutside' );
      ParticleUtils.removeAllParticles( this.lightParticlesOutside );
      assert && assert( this.lightParticlesOutside.lengthProperty.value === 0, 'there should be no lightParticlesOutside' );
    }

    /**
     * Steps the particle system.
     * @param {number} dt - time delta, in ps
     * @public
     */
    step( dt ) {
      assert && assert( typeof dt === 'number' && dt > 0, `invalid dt: ${dt}` );

      ParticleUtils.stepParticles( this.heavyParticles, dt );
      ParticleUtils.stepParticles( this.lightParticles, dt );
      ParticleUtils.stepParticles( this.heavyParticlesOutside, dt );
      ParticleUtils.stepParticles( this.lightParticlesOutside, dt );
    }

    /**
     * Heats or cools the particle system.
     * @param {number} heatCoolFactor - [-1,1] see HeaterCoolerNode heatCoolAmountProperty
     * @public
     */
    heatCool( heatCoolFactor ) {
      assert && assert( typeof heatCoolFactor === 'number' && heatCoolFactor >= -1 && heatCoolFactor <= 1,
        `invalid heatCoolFactor: ${heatCoolFactor}` );

      if ( heatCoolFactor !== 0 ) {
        ParticleUtils.heatCoolParticles( this.heavyParticles, heatCoolFactor );
        ParticleUtils.heatCoolParticles( this.lightParticles, heatCoolFactor );
      }
    }

    /**
     * Allows particles to escape from the opening in the top of the container.
     * @param {GasPropertiesContainer} container
     * @public
     */
    escapeParticles( container ) {
      assert && assert( container instanceof GasPropertiesContainer, `invalid container: ${container}` );

      if ( container.isLidOpen() ) {

        ParticleUtils.escapeParticles( container, this.numberOfHeavyParticlesProperty,
          this.heavyParticles, this.heavyParticlesOutside, );
        assert && assert( GasPropertiesUtils.isObservableArrayOf( this.heavyParticlesOutside, HeavyParticle ),
          'heavyParticlesOutside should contain only HeavyParticle' );

        ParticleUtils.escapeParticles( container, this.numberOfLightParticlesProperty,
          this.lightParticles, this.lightParticlesOutside );
        assert && assert( GasPropertiesUtils.isObservableArrayOf( this.lightParticlesOutside, LightParticle ),
          'lightParticlesOutside should contain only LightParticle' );
      }
    }

    /**
     * Removes particles that have floated above the specified bounds.
     * This is used to dispose of particles once they have float out of the container and off the top of the window.
     * @param {Bounds2} bounds
     * @public
     */
    removeParticlesAboveBounds( bounds ) {
      assert && assert( bounds instanceof Bounds2, `invalid bounds: ${bounds}` );

      ParticleUtils.removeParticlesAboveBounds( this.heavyParticlesOutside, bounds );
      ParticleUtils.removeParticlesAboveBounds( this.lightParticlesOutside, bounds );
    }

    /**
     * Adjusts an array of particles to have the desired number of elements.
     * @param {number} newValue - new number of particles
     * @param {number} oldValue - old number of particles
     * @param {ObservableArray} particles - array of particles that corresponds to newValue and oldValue
     * @param {function(options:*):Particle} createParticle - creates a Particle instance
     * @private
     */
    updateNumberOfParticles( newValue, oldValue, particles, createParticle ) {
      assert && assert( typeof newValue === 'number', `invalid newValue: ${newValue}` );
      assert && assert( oldValue === null || typeof oldValue === 'number', `invalid oldValue: ${oldValue}` );
      assert && assert( particles instanceof ObservableArray, `invalid particles: ${particles}` );
      assert && assert( typeof createParticle === 'function', `invalid createParticle: ${createParticle}` );

      if ( particles.lengthProperty.value !== newValue ) {
        const delta = newValue - oldValue;
        if ( delta > 0 ) {
          this.addParticles( delta, particles, createParticle );
        }
        else if ( delta < 0 ) {
          ParticleUtils.removeParticles( -delta, particles );
        }
        assert && assert( particles.length === newValue, 'particles array is out of sync' );
      }
    }

    /**
     * Adds n particles to the end of the specified array.
     * @param {number} n
     * @param {ObservableArray} particles
     * @param {function(options:*):Particle} createParticle - creates a Particle instance
     * @private
     */
    addParticles( n, particles, createParticle ) {
      assert && assert( typeof n === 'number' && n > 0, `invalid n: ${n}` );
      assert && assert( particles instanceof ObservableArray, `invalid particles: ${particles}` );
      assert && assert( typeof createParticle === 'function', `invalid createParticle: ${createParticle}` );

      // Get the temperature that will be used to compute initial velocity magnitude.
      const initialTemperature = this.getInitialTemperature();

      // Create a set of temperature values that will be used to compute initial speed.
      let temperatures = null;
      if ( n !== 1 && this.collisionsEnabledProperty.value ) {

        // For groups of particles with particle-particle collisions enabled, create some deviation in the
        // temperature used to compute speed, but maintain the desired mean.  This makes the motion of a group
        // of particles look less wave-like. We do this for temperature instead of speed because temperature
        // in the container is T = (2/3)KE/k, and KE is a function of speed^2, so deviation in speed would
        // change the desired temperature.
        temperatures = GasPropertiesUtils.getGaussianValues( n, initialTemperature, 0.2 * initialTemperature, 1E-3 );
      }
      else {

        // For single particles, or if particle-particle collisions are disabled, use the same temperature
        // for all particles. For groups of particles, this yields wave-like motion.
        temperatures = [];
        for ( let i = 0; i < n; i++ ) {
          temperatures[ i ] = initialTemperature;
        }
      }

      // Create n particles
      for ( let i = 0; i < n; i++ ) {
        assert && assert( i < temperatures.length, `index out of range, i: ${i}` );

        const particle = createParticle();

        // Position the particle just inside the container, accounting for radius.
        particle.setLocationXY( this.particleEntryLocation.x - particle.radius, this.particleEntryLocation.y );

        // Set the initial velocity
        particle.setVelocityPolar(
          // |v| = sqrt( 3kT / m )
          Math.sqrt( 3 * GasPropertiesConstants.BOLTZMANN * temperatures[ i ] / particle.mass ),

          // Velocity angle is randomly chosen from pump's dispersion angle, perpendicular to right wall of container.
          Math.PI - PARTICLE_DISPERSION_ANGLE / 2 + phet.joist.random.nextDouble() * PARTICLE_DISPERSION_ANGLE
        );

        particles.push( particle );
      }
    }

    /**
     * Redistributes the particles horizontally in the container.  This is used in the Ideal screen, where resizing
     * the container results in the particles being redistributed in the new container width.
     * @param {number} scaleX - amount to scale the x location
     * @public
     */
    redistributeParticles( scaleX ) {
      assert && assert( typeof scaleX === 'number' && scaleX > 0, `invalid scaleX: ${scaleX}` );

      ParticleUtils.redistributeParticles( this.heavyParticles, scaleX );
      ParticleUtils.redistributeParticles( this.lightParticles, scaleX );
    }

    /**
     * Adjusts velocities of particle inside the container so that the resulting temperature matches
     * a specified temperature.
     * @param {number} temperature - in K
     * @public
     */
    setTemperature( temperature ) {
      assert && assert( typeof temperature === 'number', `invalid temperature: ${temperature}` );

      const desiredAverageKE = ( 3 / 2 ) * temperature * GasPropertiesConstants.BOLTZMANN; // KE = (3/2)Tk
      const actualAverageKE = this.getAverageKineticEnergy();
      const ratio = desiredAverageKE / actualAverageKE;

      for ( let i = 0; i < this.insideParticleArrays.length; i++ ) {
        const array = this.insideParticleArrays[ i ].getArray(); // use raw array for performance
        for ( let j = 0; j < array.length; j++ ) {
          const particle = array[ j ];
          const actualParticleKE = particle.getKineticEnergy();
          const desiredParticleKE = ratio * actualParticleKE;
          const desiredSpeed = Math.sqrt( 2 * desiredParticleKE / particle.mass ); // |v| = Math.sqrt( 2 * KE / m )
          particle.setVelocityMagnitude( desiredSpeed );
        }
      }
    }

    /**
     * Gets the average kinetic energy of the particles in the container.
     * @returns {number} in AMU * pm^2 / ps^2
     * @public
     */
    getAverageKineticEnergy() {
      return this.getTotalKineticEnergy() / this.numberOfParticlesProperty.value;
    }

    /**
     * Gets the total kinetic energy of the particles in the container.
     * @returns {number} in AMU * pm^2 / ps^2
     * @private
     */
    getTotalKineticEnergy() {
      return ParticleUtils.getTotalKineticEnergy( this.heavyParticles ) +
             ParticleUtils.getTotalKineticEnergy( this.lightParticles );
    }
  }

  return gasProperties.register( 'ParticleSystem', ParticleSystem );
} );