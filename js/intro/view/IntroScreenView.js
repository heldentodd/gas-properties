// Copyright 2018, University of Colorado Boulder

/**
 * The view for the 'Intro' screen.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( function( require ) {
  'use strict';

  // modules
  var BicyclePumpNode = require( 'GAS_PROPERTIES/common/view/BicyclePumpNode' );
  var BooleanProperty = require( 'AXON/BooleanProperty' );
  var ContainerNode = require( 'GAS_PROPERTIES/common/view/ContainerNode' );
  var gasProperties = require( 'GAS_PROPERTIES/gasProperties' );
  var GasPropertiesConstants = require( 'GAS_PROPERTIES/common/GasPropertiesConstants' );
  var HoldConstantPanel = require( 'GAS_PROPERTIES/intro/view/HoldConstantPanel' );
  var inherit = require( 'PHET_CORE/inherit' );
  var ParticleCountsAccordionBox = require( 'GAS_PROPERTIES/intro/view/ParticleCountsAccordionBox' );
  var ParticleTypeControl = require( 'GAS_PROPERTIES/intro/view/ParticleTypeControl' );
  var ResetAllButton = require( 'SCENERY_PHET/buttons/ResetAllButton' );
  var ScreenView = require( 'JOIST/ScreenView' );
  var SizeCheckbox = require( 'GAS_PROPERTIES/intro/view/SizeCheckbox' );
  var StringProperty = require( 'AXON/StringProperty' );
  var TimeControls = require( 'GAS_PROPERTIES/common/view/TimeControls' );

  // constants
  var PANEL_WIDTH = 250;
  var PARTICLE_TYPE_VALUES = [ 'heavy', 'light' ];

  /**
   * @param {IntroModel} model
   * @constructor
   */
  function IntroScreenView( model ) {

    ScreenView.call( this );

    // view-specific Properties
    var particleTypeProperty = new StringProperty( 'heavy', {
      validValues: PARTICLE_TYPE_VALUES
    } );
    var particleCountsExpandedProperty = new BooleanProperty( false );
    var sizeVisibleProperty = new BooleanProperty( false );

    // Container
    var containerNode = new ContainerNode( model.container, {
      left: this.layoutBounds.left + GasPropertiesConstants.SCREEN_VIEW_X_MARGIN,
      centerY: this.layoutBounds.centerY
    } );
    this.addChild( containerNode );

    // Time controls
    var timeControls = new TimeControls( model.isPlayingProperty,
      function() {
        model.isPlayingProperty.value = true;
        model.step();
        model.isPlayingProperty.value = false;
      }, {
        left: this.layoutBounds.left + GasPropertiesConstants.SCREEN_VIEW_X_MARGIN,
        bottom: this.layoutBounds.bottom - GasPropertiesConstants.SCREEN_VIEW_Y_MARGIN
      } );
    this.addChild( timeControls );

    // Radio buttons for selecting particle type
    var particleTypeControl = new ParticleTypeControl( particleTypeProperty, {
      left: containerNode.right + 60,
      bottom: this.layoutBounds.bottom - GasPropertiesConstants.SCREEN_VIEW_Y_MARGIN
    } );
    this.addChild( particleTypeControl );

    // Bicycle pump
    var bicyclePumpNode = new BicyclePumpNode( particleTypeProperty, {
      centerX: particleTypeControl.centerX,
      bottom: particleTypeControl.top - 15
    } );
    this.addChild( bicyclePumpNode );

    // Hold Constant panel
    var holdConstantPanel = new HoldConstantPanel( model.holdConstantProperty, {
      fixedWidth: PANEL_WIDTH,
      right: this.layoutBounds.right - GasPropertiesConstants.SCREEN_VIEW_X_MARGIN,
      top: this.layoutBounds.top + GasPropertiesConstants.SCREEN_VIEW_Y_MARGIN
    } );
    this.addChild( holdConstantPanel );

    // Particle Counts accordion box
    var particleCountsAccordionBox = new ParticleCountsAccordionBox(
      model.numberOfHeavyParticlesProperty, model.numberOfLightParticlesProperty, {
        fixedWidth: PANEL_WIDTH,
        expandedProperty: particleCountsExpandedProperty,
        right: holdConstantPanel.right,
        top: holdConstantPanel.bottom + 15
      } );
    this.addChild( particleCountsAccordionBox );

    // Size checkbox, positioned below the *expanded* Particle Counts accordion box
    var particleCountsExpanded = particleCountsExpandedProperty.value; // save state
    particleCountsExpandedProperty.value = true; // expand for positioning
    var sizeCheckbox = new SizeCheckbox( sizeVisibleProperty, {
      left: particleCountsAccordionBox.left,
      top: particleCountsAccordionBox.bottom + 15
    } );
    this.addChild( sizeCheckbox );
    particleCountsExpandedProperty.value = particleCountsExpanded; // restore state

    // Reset All button
    var resetAllButton = new ResetAllButton( {
      listener: function() {
        model.reset();
        particleCountsExpandedProperty.reset();
        sizeVisibleProperty.reset();
      },
      right: this.layoutBounds.maxX - GasPropertiesConstants.SCREEN_VIEW_X_MARGIN,
      bottom: this.layoutBounds.maxY - GasPropertiesConstants.SCREEN_VIEW_Y_MARGIN
    } );
    this.addChild( resetAllButton );
  }

  gasProperties.register( 'IntroScreenView', IntroScreenView );

  return inherit( ScreenView, IntroScreenView );
} );