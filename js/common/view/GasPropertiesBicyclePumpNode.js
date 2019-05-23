// Copyright 2018-2019, University of Colorado Boulder

/**
 * Bicycle pump, used to add particles to the container.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const BicyclePumpNode = require( 'SCENERY_PHET/BicyclePumpNode' );
  const NumberProperty = require( 'AXON/NumberProperty' );
  const gasProperties = require( 'GAS_PROPERTIES/gasProperties' );
  const Property = require( 'AXON/Property' );

  class GasPropertiesBicyclePumpNode extends BicyclePumpNode {

    /**
     * @param {NumberProperty} numberOfParticlesProperty
     * @param {Object} [options]
     * @constructor
     */
    constructor( numberOfParticlesProperty, options ) {
      assert && assert( numberOfParticlesProperty instanceof NumberProperty,
        `invalid numberOfParticlesProperty: ${numberOfParticlesProperty}` );

      options = _.extend( {
        height: 230,
        bodyTopFill: 'white',
        hoseCurviness: 0.75,
        dragListenerOptions: {
          numberOfParticlesPerPumpAction: 50,
          addParticlesOneAtATime: false
        }
      }, options );

      assert && assert( numberOfParticlesProperty.range, 'missing numberOfParticlesProperty.range' );

      super( numberOfParticlesProperty, new Property( numberOfParticlesProperty.range ), options );
    }
  }

  return gasProperties.register( 'GasPropertiesBicyclePumpNode', GasPropertiesBicyclePumpNode );
} );
 