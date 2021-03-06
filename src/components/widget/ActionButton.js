import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { dropdownRequest } from '../../actions/GenericActions';
import DocumentStatusContextShortcuts from '../keyshortcuts/DocumentStatusContextShortcuts';

class ActionButton extends Component {
  constructor(props) {
    super(props);

    this.state = {
      list: [],
      selected: 0,
    };
  }

  componentDidMount() {
    this.fetchStatusList();
  }

  handleKeyDown = e => {
    const { list, selected } = this.state;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.navigate(true);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.navigate();
        break;
      case 'Enter':
        e.preventDefault();
        if (selected != null) {
          this.handleChangeStatus(list[selected]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        this.handleDropdownBlur();
        break;
    }
  };

  navigate = up => {
    const { selected, list } = this.state;
    const next = up ? selected + 1 : selected - 1;

    this.setState({
      selected: next >= 0 && next <= list.length ? next : selected,
    });
  };

  handleDropdownBlur = () => {
    if (this.statusDropdown) {
      this.statusDropdown.classList.remove('dropdown-status-open');
    }
  };

  handleDropdownFocus = () => {
    const { dropdownOpenCallback } = this.props;

    this.fetchStatusList();
    dropdownOpenCallback();
    this.statusDropdown.classList.add('dropdown-status-open');
  };

  fetchStatusList() {
    const { windowType, fields, dataId } = this.props;
    if (!dataId) {
      return;
    }
    dropdownRequest({
      docId: dataId,
      docType: windowType,
      entity: 'window',
      propertyName: fields[1].field,
    }).then(res => {
      this.setState({
        list: res.data.values,
      });
    });
  }

  handleChangeStatus = status => {
    const { onChange } = this.props;
    const changePromise = onChange(status);

    this.statusDropdown.blur();
    if (changePromise instanceof Promise) {
      changePromise.then(() => this.fetchStatusList());
    }
  };

  getStatusClassName = abrev => {
    const { data } = this.props;

    if (data.action.value && data.action.value.key !== abrev) {
      return '';
    }

    if (abrev === 'DR') {
      return 'dropdown-status-item-def';
    } else if (abrev === 'CO') {
      return 'dropdown-status-item-def-1';
    } else {
      return '';
    }
  };

  getStatusContext = abrev => {
    if (abrev === 'DR') {
      return 'primary';
    } else if (abrev === 'CO') {
      return 'success';
    } else {
      return 'default';
    }
  };

  renderStatusList = list => {
    const { selected } = this.state;

    return list.map((item, index) => {
      return (
        <li
          key={index}
          className={
            'dropdown-status-item ' +
            (selected === index ? 'dropdown-status-item-on-key ' : '') +
            this.getStatusClassName(item.key)
          }
          onClick={() => this.handleChangeStatus(item)}
        >
          {item.caption}
        </li>
      );
    });
  };

  render() {
    const { data, modalVisible } = this.props;
    const { list } = this.state;
    const abrev = data.status.value && data.status.value.key;
    const status = this.getStatusContext(abrev);
    let value;

    if (abrev) {
      value = data.status.value.caption;
    }

    return (
      <div
        onKeyDown={this.handleKeyDown}
        className="meta-dropdown-toggle dropdown-status-toggler js-dropdown-toggler"
        tabIndex={modalVisible ? -1 : 0}
        ref={c => (this.statusDropdown = c)}
        onBlur={this.handleDropdownBlur}
        onFocus={this.handleDropdownFocus}
      >
        {value ? (
          <div className={`tag tag-${status}`}>{value}</div>
        ) : (
          <div
            className={`tag tag-${status}`}
            dangerouslySetInnerHTML={{ __html: '&nbsp;' }}
          />
        )}
        <i className={`meta-icon-chevron-1 meta-icon-${status}`} />
        <ul className="dropdown-status-list">{this.renderStatusList(list)}</ul>
        <DocumentStatusContextShortcuts
          handleDocumentCompleteStatus={() => {
            this.handleChangeStatus(list.find(elem => elem.key === 'CO'));
          }}
        />
      </div>
    );
  }
}

ActionButton.propTypes = {
  dispatch: PropTypes.func.isRequired,
  modalVisible: PropTypes.bool.isRequired,
};

export default connect(state => ({
  modalVisible: state.windowHandler.modal.visible,
}))(ActionButton);
