/**
 * TagmanagerSetup component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Button from 'GoogleComponents/button';
import Link from 'GoogleComponents/link';
import data from 'GoogleComponents/data';
import ProgressBar from 'GoogleComponents/progress-bar';
import { Select, Option } from 'SiteKitCore/material-components';
import SvgIcon from 'GoogleUtil/svg-icon';
import PropTypes from 'prop-types';
import { toggleConfirmModuleSettings } from 'GoogleUtil';

const { __ } = wp.i18n;
const { Component, Fragment } = wp.element;
const {
	removeFilter,
	addFilter,
} = wp.hooks;

class TagmanagerSetup extends Component {

	constructor( props ) {
		super( props );

		const {
			accountId,
			containerId,
		} = googlesitekit.modules.tagmanager.settings;

		this.state = {
			isLoading: true,
			accounts: [],
			containers: [],
			error: false,
			message: '',
			refetch: false,
			selectedAccount: accountId ? accountId : 0,
			selectedContainer: containerId ? containerId : 0,
			containersLoading: false,
		};

		this.handleSubmit = this.handleSubmit.bind( this );
		this.renderAccountDropdownForm = this.renderAccountDropdownForm.bind( this );
		this.handleAccountChange = this.handleAccountChange.bind( this );
		this.handleContainerChange = this.handleContainerChange.bind( this );
		this.refetchAccount = this.refetchAccount.bind( this );

	}

	componentDidMount() {
		this._isMounted = true;
		this.requestTagManagerAccounts();

		// Handle save hook from the settings page.
		addFilter( 'googlekit.SettingsConfirmed',
			'googlekit.TagmanagerSettingsConfirmed',
			( chain, module ) => {
				if ( 'tagmanager' !== module.replace( '-module', '' ) ) {
					return chain;
				}
				const { isEditing } = this.props;
				if ( isEditing ) {
					return this.handleSubmit();
				}
			} );

		this.toggleConfirmChangesButton();
	}

	componentDidUpdate() {
		const { refetch } = this.state;

		if ( refetch ) {
			this.requestTagManagerAccounts();
		}

		this.toggleConfirmChangesButton();
	}

	componentWillUnmount() {
		this._isMounted = false;

		removeFilter( 'googlekit.SettingsConfirmed', 'googlekit.TagmanagerSettingsConfirmed' );
	}

	/**
	 * Toggle confirm changes button disable/enable depending on the changed settings.
	 */
	toggleConfirmChangesButton() {

		if ( ! this.props.isEditing ) {
			return;
		}

		const settingsMapping = {
			selectedContainer: 'containerId',
			selectedAccount: 'selectedAccount',
		};

		toggleConfirmModuleSettings( 'tagmanager', settingsMapping, this.state );
	}

	/**
	 * Request Tag Manager accounts.
	 */
	async requestTagManagerAccounts() {

		try {
			const {
				selectedAccount,
				selectedContainer,
			} = this.state;

			const queryArgs = {
				accountId: selectedAccount,
			};

			let responseData = await data.get( 'modules', 'tagmanager', 'list-accounts', queryArgs );

			const chooseContainer = {
				containerId: 0,
				publicId: 0
			};
			responseData.containers.push( chooseContainer );

			if ( this._isMounted ) {
				this.setState( {
					isLoading: false,
					accounts: responseData.accounts,
					selectedAccount: ( selectedAccount ) ? selectedAccount : responseData.accounts[0].accountId,
					containers: responseData.containers,
					selectedContainer: ( selectedContainer ) ? selectedContainer : responseData.containers[0].publicId,
					refetch: false,
					error: false,
				} );
			}
		} catch ( err ) {
			if ( this._isMounted ) {
				this.setState( {
					isLoading: false,
					error: err.code,
					message: err.message,
					refetch: false,
				} );
			}
		}
	}

	/**
	 * Request Tag Manager accounts.
	 *
	 * @param {string} selectedAccount The account ID to get containers from.
	 */
	async requestTagManagerContainers( selectedAccount ) {
		try {
			const queryArgs = {
				accountId: selectedAccount,
			};

			let responseData = await data.get( 'modules', 'tagmanager', 'list-containers', queryArgs );

			const chooseContainer = {
				containerId: 0,
				publicId: 0
			};
			responseData.containers.push( chooseContainer );
			if ( this._isMounted ) {
				this.setState( {
					containersLoading: false,
					containers: responseData.containers,
					selectedContainer: responseData.containers[0].publicId,
					error: false,
				} );
			}
		} catch ( err ) {
			if ( this._isMounted ) {
				this.setState( {
					error: err.code,
					message: err.message,
				} );
			}
		}
	}

	async handleSubmit() {
		const {
			selectedAccount,
			selectedContainer
		} = this.state;

		const { finishSetup } = this.props;

		try {
			const optionData = {
				accountId: selectedAccount,
				containerId: selectedContainer,
			};

			const responseData = await data.set( 'modules', 'tagmanager', 'save', optionData );
			if ( finishSetup ) {
				finishSetup();
			}

			googlesitekit.modules.tagmanager.settings = {
				accountId: responseData.accountId,
				containerId: responseData.containerId,
			};

			if ( this._isMounted ) {
				this.setState( {
					isSaving: false
				} );
			}

		} catch ( err ) {

			// Catches error in handleButtonAction from <SettingsModules> component.
			return new Promise( ( resolve, reject ) => {
				reject( err );
			} );
		}
	}

	static createNewAccount( e ) {
		e.preventDefault();
		window.open( 'https://marketingplatform.google.com/about/tag-manager/', '_blank' );
	}

	handleAccountChange( index, item ) {
		const { selectedAccount } = this.state;
		const selectValue = item.getAttribute( 'data-value' );

		if ( selectValue === selectedAccount ) {
			return;
		}

		if ( this._isMounted ) {
			this.setState( {
				containersLoading: true,
				selectedAccount: selectValue,
			} );
		}

		this.requestTagManagerContainers( selectValue );
	}

	handleContainerChange( index, item ) {
		const { selectedContainer } = this.state;
		const selectValue = item.getAttribute( 'data-value' );

		if ( selectValue === selectedContainer ) {
			return;
		}

		if ( this._isMounted ) {
			this.setState( {
				selectedContainer: selectValue,
			} );
		}

	}

	refetchAccount( e ) {
		e.preventDefault();
		if ( this._isMounted ) {
			this.setState( {
				isLoading: true,
				refetch: true,
				error: false,
			} );
		}
	}

	renderSettingsInfo() {
		const {
			selectedAccount,
			selectedContainer,
		} = this.state;

		return (
			<Fragment>
				<div className="googlesitekit-settings-module__meta-items">
					<div className="googlesitekit-settings-module__meta-item">
						<p className="googlesitekit-settings-module__meta-item-type">
							{ __( 'Account', 'google-site-kit' ) }
						</p>
						<h5 className="googlesitekit-settings-module__meta-item-data">
							{ selectedAccount || false }
						</h5>
					</div>
					<div className="googlesitekit-settings-module__meta-item">
						<p className="googlesitekit-settings-module__meta-item-type">
							{ __( 'Container ID', 'google-site-kit' ) }
						</p>
						<h5 className="googlesitekit-settings-module__meta-item-data">
							{ selectedContainer || false }
						</h5>
					</div>
				</div>
			</Fragment>
		);
	}

	renderAccountDropdownForm() {
		const {
			accounts,
			selectedAccount,
			containers,
			selectedContainer,
			isLoading,
			containersLoading,
		} = this.state;

		const {
			onSettingsPage,
		} = this.props;

		if ( isLoading ) {
			return <ProgressBar/>;
		}

		if ( 0 >= accounts.length ) {
			return (
				<Fragment>
					<div className="googlesitekit-setup-module__action">
						<Button onClick={ TagmanagerSetup.createNewAccount }>{ __( 'Create an account', 'google-site-kit' ) }</Button>

						<div className="googlesitekit-setup-module__sub-action">
							<Link onClick={ this.refetchAccount }>{ __( 'Re-fetch My Account', 'google-site-kit' ) }</Link>
						</div>
					</div>
				</Fragment>
			);
		}

		return (
			<Fragment>
				<p>{ __( 'Please select your Tag Manager account and container below, the snippet will be inserted automatically into your site.', 'google-site-kit' ) }</p>
				<div className="googlesitekit-setup-module__inputs">
					<Select
						enhanced
						name='accounts'
						label={ __( 'Account', 'google-site-kit' ) }
						value={ selectedAccount }
						onEnhancedChange={ this.handleAccountChange }
						outlined
					>
						{ accounts.map( account =>
							<Option
								key={ account.accountId }
								value={ account.accountId }>
								{ account.name }
							</Option> ) }
					</Select>

					{ containersLoading ? ( <ProgressBar small /> ) : (
						<Select
							enhanced
							name='containers'
							label={ __( 'Container', 'google-site-kit' ) }
							value={ selectedContainer }
							onEnhancedChange={ this.handleContainerChange }
							outlined
						>
							{ containers.map( container =>
								<Option
									key={ container.containerId }
									value={ container.publicId }>
									{
										0 === container.publicId ?
											__( 'Set up a new container', 'google-site-kit' ) :
											container.publicId
									}
								</Option> ) }
						</Select>
					) }
				</div>

				{ /*Render the continue and skip button.*/ }
				{
					! onSettingsPage &&
					<div className="googlesitekit-setup-module__action">
						<Button onClick={ this.handleSubmit }>{ __( 'Confirm & Continue', 'google-site-kit' ) }</Button>
					</div>
				}

			</Fragment>
		);
	}

	render() {
		const {
			error,
			message
		} = this.state;

		const {
			onSettingsPage,
			isEditing
		} = this.props;

		return (
			<div className="googlesitekit-setup-module googlesitekit-setup-module--tag-manager">
				{
					! onSettingsPage &&
					<Fragment>
						<div className="googlesitekit-setup-module__logo">
							<SvgIcon id="tagmanager" width="33" height="33"/>
						</div>
						<h2 className="
							googlesitekit-heading-3
							googlesitekit-setup-module__title
						">
							{ __( 'Tag Manager', 'google-site-kit' ) }
						</h2>
					</Fragment>
				}

				{ error && 0 < message.length &&
				<div className="googlesitekit-error-text">
					<p>{ __( 'Error:', 'google-site-kit' ) } { message }</p>
				</div>
				}

				{ isEditing && this.renderAccountDropdownForm() }

				{ ! isEditing && this.renderSettingsInfo() }

			</div>
		);
	}
}

TagmanagerSetup.propTypes = {
	onSettingsPage: PropTypes.bool,
	finishSetup: PropTypes.func,
	isEditing: PropTypes.bool,
};

TagmanagerSetup.defaultProps = {
	onSettingsPage: true,
	isEditing: false,
};

export default TagmanagerSetup;
