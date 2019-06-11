// Copyright 2019, University of Colorado Boulder

/**
 * DiffusionCollisionDetector is a specialization of CollisionDetector that handles collisions between
 * particles and a vertical divider in a DiffusionContainer.  When the divider is present, it treats the
 * 2 sides of the container as 2 separate containers.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const BooleanProperty = require( 'AXON/BooleanProperty' );
  const CollisionDetector = require( 'GAS_PROPERTIES/common/model/CollisionDetector' );
  const DiffusionContainer = require( 'GAS_PROPERTIES/diffusion/model/DiffusionContainer' );
  const DiffusionParticle1 = require( 'GAS_PROPERTIES/diffusion/model/DiffusionParticle1' );
  const DiffusionParticle2 = require( 'GAS_PROPERTIES/diffusion/model/DiffusionParticle2' );
  const gasProperties = require( 'GAS_PROPERTIES/gasProperties' );
  const GasPropertiesUtils = require( 'GAS_PROPERTIES/common/GasPropertiesUtils' );
  const Vector2 = require( 'DOT/Vector2' );

  class DiffusionCollisionDetector extends CollisionDetector {

    /**
     * @param {DiffusionContainer} container
     * @param {ObservableArray} particles1
     * @param {ObservableArray} particles2
     * @param {Object} [options]
     */
    constructor( container, particles1, particles2, options ) {
      assert && assert( container instanceof DiffusionContainer, `invalid container: ${container}` );
      assert && assert( GasPropertiesUtils.isObservableArrayOf( particles1, DiffusionParticle1 ),
        `invalid particles1: ${particles1}` );
      assert && assert( GasPropertiesUtils.isObservableArrayOf( particles2, DiffusionParticle2 ),
        `invalid particles2: ${particles2}` );

      super( container, [ particles1, particles2 ], new BooleanProperty( true ), options );
    }

    /**
     * Detects and handles particle-container collisions for the system for one time step.
     * @returns {number} the number of collisions
     * @protected
     * @override
     */
    updateParticleContainerCollisions() {

      let numberOfParticleContainerCollisions = 0;
      if ( this.container.hasDividerProperty.value ) {

        // If the divider is in place, treat the 2 sides of the container as 2 separate containers.
        const leftWallVelocity = Vector2.ZERO;
        numberOfParticleContainerCollisions += CollisionDetector.doParticleContainerCollisions(
          this.particleArrays[ 0 ], this.container.leftBounds, leftWallVelocity );
        numberOfParticleContainerCollisions += CollisionDetector.doParticleContainerCollisions(
          this.particleArrays[ 1 ], this.container.rightBounds, leftWallVelocity );
      }
      else {

        // If there is no divider, use default behavior.
        numberOfParticleContainerCollisions = super.updateParticleContainerCollisions();
      }
      return numberOfParticleContainerCollisions;
    }
  }

  return gasProperties.register( 'DiffusionCollisionDetector', DiffusionCollisionDetector );
} );