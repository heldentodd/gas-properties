// Copyright 2018-2019, University of Colorado Boulder

/**
 * The view for the 'Ideal' screen.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const BicyclePumpNode = require( 'GAS_PROPERTIES/common/view/BicyclePumpNode' );
  const Circle = require( 'SCENERY/nodes/Circle' );
  const CollisionCounterNode = require( 'GAS_PROPERTIES/common/view/CollisionCounterNode' );
  const ContainerNode = require( 'GAS_PROPERTIES/common/view/ContainerNode' );
  const gasProperties = require( 'GAS_PROPERTIES/gasProperties' );
  const GasPropertiesColorProfile = require( 'GAS_PROPERTIES/common/GasPropertiesColorProfile' );
  const GasPropertiesConstants = require( 'GAS_PROPERTIES/common/GasPropertiesConstants' );
  const GasPropertiesHeaterCoolerNode = require( 'GAS_PROPERTIES/common/view/GasPropertiesHeaterCoolerNode' );
  const GasPropertiesThermometerNode = require( 'GAS_PROPERTIES/common/view/GasPropertiesThermometerNode' );
  const IdealControlPanel = require( 'GAS_PROPERTIES/ideal/view/IdealControlPanel' );
  const IdealViewProperties = require( 'GAS_PROPERTIES/ideal/view/IdealViewProperties' );
  const Node = require( 'SCENERY/nodes/Node' );
  const ParticleCountsAccordionBox = require( 'GAS_PROPERTIES/common/view/ParticleCountsAccordionBox' );
  const ParticlesNode = require( 'GAS_PROPERTIES/common/view/ParticlesNode' );
  const ParticleTypeEnum = require( 'GAS_PROPERTIES/common/model/ParticleTypeEnum' );
  const ParticleTypeRadioButtonGroup = require( 'GAS_PROPERTIES/common/view/ParticleTypeRadioButtonGroup' );
  const PressureGaugeNode = require( 'GAS_PROPERTIES/common/view/PressureGaugeNode' );
  const RegionsNode = require( 'GAS_PROPERTIES/common/view/RegionsNode' );
  const ResetAllButton = require( 'SCENERY_PHET/buttons/ResetAllButton' );
  const ScreenView = require( 'JOIST/ScreenView' );
  const SizeNode = require( 'GAS_PROPERTIES/common/view/SizeNode' );
  const StopwatchNode = require( 'GAS_PROPERTIES/common/view/StopwatchNode' );
  const TimeControls = require( 'GAS_PROPERTIES/common/view/TimeControls' );
  const ToggleNode = require( 'SUN/ToggleNode' );
  const VBox = require( 'SCENERY/nodes/VBox' );
  const Vector2 = require( 'DOT/Vector2' );

  // constants
  const PANEL_WIDTH = 225; // determined empirically

  class IdealScreenView extends ScreenView {

    /**
     * @param {IdealModel} model
     */
    constructor( model ) {

      super();

      const containerViewLocation = model.modelViewTransform.modelToViewPosition( model.container.location );

      // view-specific Properties
      const viewProperties = new IdealViewProperties();

      // Parent for combo box popup lists
      const comboBoxListParent = new Node();
      this.addChild( comboBoxListParent );

      // show spatial partitioning of collision detection space
      if ( phet.chipper.queryParameters.dev ) {
        this.addChild( new RegionsNode( model.getRegions(), model.getCollisionBounds(), model.modelViewTransform ) );
      }

      // Control panel at upper right
      const controlPanel = new IdealControlPanel(
        model.holdConstantProperty,
        viewProperties.sizeVisibleProperty,
        model.stopwatch.visibleProperty,
        model.collisionCounter.visibleProperty, {
          fixedWidth: PANEL_WIDTH,
          right: this.layoutBounds.right - GasPropertiesConstants.SCREEN_VIEW_X_MARGIN,
          top: this.layoutBounds.top + GasPropertiesConstants.SCREEN_VIEW_Y_MARGIN
        } );
      this.addChild( controlPanel );

      // Particle Counts accordion box
      const particleCountsAccordionBox = new ParticleCountsAccordionBox(
        model.numberOfHeavyParticlesProperty, model.numberOfLightParticlesProperty, {
          fixedWidth: PANEL_WIDTH,
          expandedProperty: viewProperties.particleCountsExpandedProperty,
          right: controlPanel.right,
          top: controlPanel.bottom + 15
        } );
      this.addChild( particleCountsAccordionBox );

      // Bicycle pumps, one of which is visible depending on the selected particle type
      const bicyclePumpsToggleNode = new ToggleNode( viewProperties.particleTypeProperty, [

        // Bicycle pump for heavy particles
        {
          value: ParticleTypeEnum.HEAVY,
          node: new BicyclePumpNode( model.numberOfHeavyParticlesProperty, {
            color: GasPropertiesColorProfile.heavyParticleColorProperty
          } )
        },

        // Bicycle pump for light particles
        {
          value: ParticleTypeEnum.LIGHT,
          node: new BicyclePumpNode( model.numberOfLightParticlesProperty, {
            color: GasPropertiesColorProfile.lightParticleColorProperty
          } )
        }
      ] );

      // Radio buttons for selecting particle type
      const particleTypeRadioButtonGroup = new ParticleTypeRadioButtonGroup( viewProperties.particleTypeProperty );

      // Bicycle pumps + radio buttons
      const pumpBoxCenterX = containerViewLocation.x + ( particleCountsAccordionBox.left - containerViewLocation.x ) / 2;
      const pumpBox = new VBox( {
        align: 'center',
        spacing: 15,
        children: [
          bicyclePumpsToggleNode,
          particleTypeRadioButtonGroup
        ],
        centerX: pumpBoxCenterX,
        bottom: this.layoutBounds.bottom - GasPropertiesConstants.SCREEN_VIEW_Y_MARGIN
      } );
      this.addChild( pumpBox );

      // Container
      const containerNode = new ContainerNode( model.container, model.modelViewTransform, model.holdConstantProperty,
        model.isPlayingProperty, model.isTimeControlsEnabledProperty, {
          resizeHandleColor: 'rgb( 187, 154, 86 )'
        } );
      this.addChild( containerNode );

      // Dimensional arrows that indicate container size
      const sizeNode = new SizeNode( model.container.location, model.container.widthProperty,
        model.modelViewTransform, viewProperties.sizeVisibleProperty );
      this.addChild( sizeNode );

      // Device to heat/cool the contents of the container
      const heaterCoolerNodeLeft = containerViewLocation.x -
                                   model.modelViewTransform.modelToViewDeltaX( model.container.widthRange.min );
      const heaterCoolerNode = new GasPropertiesHeaterCoolerNode(
        model.heatCoolAmountProperty, model.holdConstantProperty, {
          left: heaterCoolerNodeLeft,
          bottom: this.layoutBounds.bottom - GasPropertiesConstants.SCREEN_VIEW_Y_MARGIN
        } );
      this.addChild( heaterCoolerNode );

      // Time controls
      const timeControlsLeft = containerViewLocation.x -
                               model.modelViewTransform.modelToViewDeltaX( model.container.widthRange.defaultValue );
      const timeControls = new TimeControls( model, {
        left: timeControlsLeft,
        bottom: this.layoutBounds.bottom - GasPropertiesConstants.SCREEN_VIEW_Y_MARGIN
      } );
      this.addChild( timeControls );

      // Thermometer
      const thermometerNode = new GasPropertiesThermometerNode( model.thermometer, comboBoxListParent, {
        right: containerNode.right,
        top: this.layoutBounds.top + GasPropertiesConstants.SCREEN_VIEW_Y_MARGIN
      } );
      this.addChild( thermometerNode );

      // Pressure Gauge
      const pressureGaugeNode = new PressureGaugeNode( model.pressureGauge, comboBoxListParent, {
        left: containerNode.right - 2,
        centerY: model.modelViewTransform.modelToViewY( model.container.top ) + 30
      } );
      this.addChild( pressureGaugeNode );
      pressureGaugeNode.moveToBack(); // to hide overlap with container

      // Reset All button
      const resetAllButton = new ResetAllButton( {
        listener: () => {
          model.reset();
          viewProperties.reset();
        },
        right: this.layoutBounds.maxX - GasPropertiesConstants.SCREEN_VIEW_X_MARGIN,
        bottom: this.layoutBounds.maxY - GasPropertiesConstants.SCREEN_VIEW_Y_MARGIN
      } );
      this.addChild( resetAllButton );

      // @private
      this.particlesNode = new ParticlesNode( model, this.layoutBounds );
      this.addChild( this.particlesNode );

      // Collision Counter
      const collisionCounterNode = new CollisionCounterNode( model.collisionCounter, this.visibleBoundsProperty,
        comboBoxListParent );
      this.addChild( collisionCounterNode );

      // Stopwatch
      const stopwatchNode = new StopwatchNode( model.stopwatch, this.visibleBoundsProperty );
      this.addChild( stopwatchNode );

      // show model origin
      if ( phet.chipper.queryParameters.dev ) {
        this.addChild( new Circle( 3, {
          fill: 'red',
          center: model.modelViewTransform.modelToViewPosition( Vector2.ZERO )
        } ) );
      }

      // This should be in front of everything else.
      comboBoxListParent.moveToFront();
    }

    /**
     * Called on each step of the simulation's timer.
     * @param {number} dt - delta time, in seconds
     */
    step( dt ) {
      this.particlesNode.step( dt );
    }
  }

  return gasProperties.register( 'IdealScreenView', IdealScreenView );
} );