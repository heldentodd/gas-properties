// Copyright 2018-2020, University of Colorado Boulder

/**
 * GasPropertiesCheckbox is a specialization of Checkbox for this sim.  It can be labeled with text and/or an icon,
 * and has the correct options and color profiling for this sim.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import BooleanProperty from '../../../../axon/js/BooleanProperty.js';
import merge from '../../../../phet-core/js/merge.js';
import HBox from '../../../../scenery/js/nodes/HBox.js';
import RichText from '../../../../scenery/js/nodes/RichText.js';
import Checkbox from '../../../../sun/js/Checkbox.js';
import gasProperties from '../../gasProperties.js';
import GasPropertiesColorProfile from '../GasPropertiesColorProfile.js';
import GasPropertiesConstants from '../GasPropertiesConstants.js';

class GasPropertiesCheckbox extends Checkbox {

  /**
   * @param {BooleanProperty} booleanProperty
   * @param {Object} [options]
   */
  constructor( booleanProperty, options ) {
    assert && assert( booleanProperty instanceof BooleanProperty, `invalid booleanProperty: ${booleanProperty}` );

    options = merge( {}, GasPropertiesConstants.CHECKBOX_OPTIONS, {
      text: null, // {string|null} optional text label
      icon: null, // {Node|null} optional icon, to the right of text
      textFill: GasPropertiesColorProfile.textFillProperty,
      textMaxWidth: null,
      textIconSpacing: 10, // horizontal space between text and icon
      font: GasPropertiesConstants.CONTROL_FONT,

      // superclass options
      checkboxColor: GasPropertiesColorProfile.checkboxStrokeProperty,
      checkboxColorBackground: GasPropertiesColorProfile.checkboxFillProperty
    }, options );

    assert && assert( options.text || options.icon, 'text or icon is required' );

    const contentChildren = [];

    if ( options.text ) {
      contentChildren.push( new RichText( options.text, {
        fill: options.textFill,
        font: options.font,
        maxWidth: options.textMaxWidth
      } ) );
    }

    if ( options.icon ) {
      contentChildren.push( options.icon );
    }

    let content = null;
    if ( contentChildren.length === 1 ) {
      content = contentChildren[ 0 ];
    }
    else {
      content = new HBox( {
        align: 'center',
        spacing: options.textIconSpacing,
        children: contentChildren
      } );
    }

    super( content, booleanProperty, options );
  }
}

gasProperties.register( 'GasPropertiesCheckbox', GasPropertiesCheckbox );
export default GasPropertiesCheckbox;