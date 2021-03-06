// Copyright 2019-2020, University of Colorado Boulder

/**
 * IdealModel is the top-level model for the 'Ideal' screen.
 * It adds no additional functionality to the base class, but is provided for symmetry in the model-view type hierarchy.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Tandem from '../../../../tandem/js/Tandem.js';
import IdealGasLawModel from '../../common/model/IdealGasLawModel.js';
import gasProperties from '../../gasProperties.js';

class IdealModel extends IdealGasLawModel {

  /**
   * @param {Tandem} tandem
   */
  constructor( tandem ) {
    assert && assert( tandem instanceof Tandem, `invalid tandem: ${tandem}` );
    super( tandem );
  }
}

gasProperties.register( 'IdealModel', IdealModel );
export default IdealModel;