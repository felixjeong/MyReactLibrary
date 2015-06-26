/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import Component          from './Component';

export default class Fieldset extends Component {

  static propTypes = {
    children: PropTypes.node,
    component: PropTypes.oneOfType([PropTypes.string, PropTypes.element])
  };

  static defaultProps = {
    component: 'div'
  };

  render() {
    let {component: Element, ...props} = this.props;
    return <Element {...props} />;
  }
}
