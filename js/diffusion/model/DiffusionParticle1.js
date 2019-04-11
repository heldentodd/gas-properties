// Copyright 2019, University of Colorado Boulder

/**
 * Model for the 1st type of particle in the 'Diffusion' screen.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const DiffusionParticle = require( 'GAS_PROPERTIES/diffusion/model/DiffusionParticle' );
  const gasProperties = require( 'GAS_PROPERTIES/gasProperties' );
  const GasPropertiesColorProfile = require( 'GAS_PROPERTIES/common/GasPropertiesColorProfile' );

  class DiffusionParticle1 extends DiffusionParticle {

    /**
     * @param {Object} [options] see Particle
     */
    constructor( options ) {
      super( _.extend( {
        colorProperty: GasPropertiesColorProfile.diffusionDiffusionParticle1ColorProperty,
        highlightColorProperty: GasPropertiesColorProfile.diffusionDiffusionParticle1ColorProperty
      }, options ) );
    }
  }

  return gasProperties.register( 'DiffusionParticle1', DiffusionParticle1 );
} );