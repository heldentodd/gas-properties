// Copyright 2019, University of Colorado Boulder

/**
 * Control panel that appears on the right side of the 'Diffusion' screen.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const CenterOfMassCheckbox = require( 'GAS_PROPERTIES/diffusion/view/CenterOfMassCheckbox' );
  const DividerToggleButton = require( 'GAS_PROPERTIES/diffusion/view/DividerToggleButton' );
  const FixedWidthNode = require( 'GAS_PROPERTIES/common/view/FixedWidthNode' );
  const gasProperties = require( 'GAS_PROPERTIES/gasProperties' );
  const GasPropertiesColorProfile = require( 'GAS_PROPERTIES/common/GasPropertiesColorProfile' );
  const GasPropertiesConstants = require( 'GAS_PROPERTIES/common/GasPropertiesConstants' );
  const HSeparator = require( 'SUN/HSeparator' );
  const Panel = require( 'SUN/Panel' );
  const ParticleFlowRateCheckbox = require( 'GAS_PROPERTIES/diffusion/view/ParticleFlowRateCheckbox' );
  const QuantityControl = require( 'GAS_PROPERTIES/diffusion/view/QuantityControl' );
  const StopwatchCheckbox = require( 'GAS_PROPERTIES/common/view/StopwatchCheckbox' );
  const VBox = require( 'SCENERY/nodes/VBox' );

  // strings
  const initialNumberString = require( 'string!GAS_PROPERTIES/initialNumber' );
  const massAmuString = require( 'string!GAS_PROPERTIES/massAmu' );
  const initialTemperatureKString = require( 'string!GAS_PROPERTIES/initialTemperatureK' );

  class DiffusionControlPanel extends Panel {

    /**
     * @param {DiffusionModel} model
     * @param {BooleanProperty} hasDividerProperty
     * @param {BooleanProperty} particleFlowRateVisibleProperty
     * @param {BooleanProperty} centerOfMassVisibleProperty
     * @param {BooleanProperty} stopwatchVisibleProperty
     * @param {Object} [options]
     */
    constructor( model, hasDividerProperty, particleFlowRateVisibleProperty,
                 centerOfMassVisibleProperty, stopwatchVisibleProperty, options ) {

      options = _.extend( {
        fixedWidth: 100,
        xMargin: 0
      }, GasPropertiesConstants.PANEL_OPTIONS, options );

      const separatorWidth = options.fixedWidth - ( 2 * options.xMargin );

      // Initial Number
      const initialNumberControl = new QuantityControl( model.modelViewTransform, initialNumberString,
        model.initialNumber1Property, model.initialNumber2Property, model.initialNumberRange, {
          spinnerOptions: {
            enabledProperty: hasDividerProperty,
            deltaValue: model.initialNumberDelta
          }
        } );

      // Mass (AMU)
      const massControl = new QuantityControl( model.modelViewTransform, massAmuString,
        model.mass1Property, model.mass2Property, model.massRange, {
          spinnerOptions: {
            enabledProperty: hasDividerProperty,
            deltaValue: model.massDelta,
            xMargin: 12 // empirical hack to make all spinners the same same width
          }
        } );

      // Initial Temperature (K)
      const initialTemperatureControl = new QuantityControl( model.modelViewTransform, initialTemperatureKString,
        model.initialTemperature1Property, model.initialTemperature2Property, model.initialTemperatureRange, {
          spinnerOptions: {
            enabledProperty: hasDividerProperty,
            deltaValue: model.initialTemperatureDelta
          }
        } );

      // When the divider is returned, reset the experiment.
      hasDividerProperty.link( hasDivider => {
        if ( hasDivider ) {
          model.resetExperiment();
        }
      } );

      const content = new VBox( {
        align: 'left',
        spacing: 22,
        children: [
          new VBox( {
            spacing: 20,
            align: 'left',
            children: [
              //TODO alignment - spinners have different ranges, so different widths
              initialNumberControl,
              massControl,
              initialTemperatureControl,
              new DividerToggleButton( hasDividerProperty ) //TODO center
            ]
          } ),
          new HSeparator( separatorWidth, {
            stroke: GasPropertiesColorProfile.separatorColorProperty,
            maxWidth: separatorWidth
          } ),
          new VBox( {
            align: 'left',
            spacing: 12,
            children: [
              new ParticleFlowRateCheckbox( particleFlowRateVisibleProperty ),
              new CenterOfMassCheckbox( centerOfMassVisibleProperty ),
              new StopwatchCheckbox( stopwatchVisibleProperty )
            ]
          } )
        ]
      } );

      const fixedWidthNode = new FixedWidthNode( content, {
        fixedWidth: separatorWidth
      } );

      super( fixedWidthNode, options );
    }
  }

  return gasProperties.register( 'DiffusionControlPanel', DiffusionControlPanel );
} );