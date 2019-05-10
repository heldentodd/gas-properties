// Copyright 2019, University of Colorado Boulder

/**
 * Renders the particle system for the 'Ideal', 'Explore', and 'Energy' screens.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const gasProperties = require( 'GAS_PROPERTIES/gasProperties' );
  const GasPropertiesColorProfile = require( 'GAS_PROPERTIES/common/GasPropertiesColorProfile' );
  const HeavyParticle = require( 'GAS_PROPERTIES/common/model/HeavyParticle' );
  const LightParticle = require( 'GAS_PROPERTIES/common/model/LightParticle' );
  const ParticlesNode = require( 'GAS_PROPERTIES/common/view/ParticlesNode' );
  const Property = require( 'AXON/Property' );

  class GasPropertiesParticlesNode extends ParticlesNode {

    /**
     * @param {GasPropertiesModel} model
     */
    constructor( model ) {

      // {Property.<HTMLCanvasElement>} generated images for the heavy and light particle types
      const heavyParticleImageProperty = new Property( null );
      const lightParticleImageProperty = new Property( null );

      // Update heavy particle image to match color profile.
      Property.multilink( [
          GasPropertiesColorProfile.heavyParticleColorProperty,
          GasPropertiesColorProfile.heavyParticleHighlightColorProperty
        ],
        ( color, highlightColor ) => {
          ParticlesNode.particleToCanvas( new HeavyParticle(), model.modelViewTransform, heavyParticleImageProperty );
        } );

      // Update light particle image to match color profile.
      Property.multilink( [
          GasPropertiesColorProfile.lightParticleColorProperty,
          GasPropertiesColorProfile.lightParticleHighlightColorProperty
        ],
        ( color, highlightColor ) => {
          ParticlesNode.particleToCanvas( new LightParticle(), model.modelViewTransform, lightParticleImageProperty );
        } );

      // {Particle[][]} arrays for each particle type
      const particleArrays = [
        model.heavyParticles, model.lightParticles,
        model.heavyParticlesOutside, model.lightParticlesOutside
      ];

      // {Property.<HTMLCanvasElement>[]} images for each particle type in particleArrays
      const imageProperties = [
        heavyParticleImageProperty, lightParticleImageProperty,
        heavyParticleImageProperty, lightParticleImageProperty
      ];

      super( particleArrays, imageProperties, model.modelViewTransform );

      // Size the canvas to match the portion of the model bounds that is above the bottom of the container.
      // Particles will never be drawn below the container, but can escape through the lid and float up.
      model.modelBoundsProperty.link( modelBounds => {
        const canvasBounds = modelBounds.withMinY( model.container.bottom );
        this.setCanvasBounds( model.modelViewTransform.modelToViewBounds( canvasBounds ) );
      } );

      // If either image changes while the sim is paused, redraw the particle system.
      Property.multilink( [ heavyParticleImageProperty, lightParticleImageProperty ],
        ( heavyParticleImage, lightParticleImage ) => { this.update(); } );
    }
  }

  return gasProperties.register( 'GasPropertiesParticlesNode', GasPropertiesParticlesNode );
} );