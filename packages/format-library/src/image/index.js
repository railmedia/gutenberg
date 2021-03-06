/**
 * WordPress dependencies
 */
import { Path, SVG, TextControl, Popover, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { insertObject } from '@wordpress/rich-text';
import {
	MediaUpload,
	RichTextToolbarButton,
	MediaUploadCheck,
} from '@wordpress/block-editor';
import { LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } from '@wordpress/keycodes';
import { keyboardReturn } from '@wordpress/icons';

const ALLOWED_MEDIA_TYPES = [ 'image' ];

const name = 'core/image';
const title = __( 'Inline image' );

const stopKeyPropagation = ( event ) => event.stopPropagation();

function getRange() {
	const selection = window.getSelection();
	return selection.rangeCount ? selection.getRangeAt( 0 ) : null;
}

export const image = {
	name,
	title,
	keywords: [ __( 'photo' ), __( 'media' ) ],
	object: true,
	tagName: 'img',
	className: null,
	attributes: {
		className: 'class',
		style: 'style',
		url: 'src',
		alt: 'alt',
	},
	edit: class ImageEdit extends Component {
		constructor() {
			super( ...arguments );
			this.onChange = this.onChange.bind( this );
			this.onKeyDown = this.onKeyDown.bind( this );
			this.openModal = this.openModal.bind( this );
			this.closeModal = this.closeModal.bind( this );
			this.anchorRef = null;
			this.state = {
				modal: false,
			};
		}

		static getDerivedStateFromProps( props, state ) {
			const {
				activeObjectAttributes: { style },
			} = props;

			if ( style === state.previousStyle ) {
				return null;
			}

			if ( ! style ) {
				return {
					width: undefined,
					previousStyle: style,
				};
			}

			return {
				width: style.replace( /\D/g, '' ),
				previousStyle: style,
			};
		}

		onChange( width ) {
			this.setState( { width } );
		}

		onKeyDown( event ) {
			if (
				[ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].indexOf(
					event.keyCode
				) > -1
			) {
				// Stop the key event from propagating up to ObserveTyping.startTypingInTextField.
				event.stopPropagation();
			}
		}

		openModal() {
			this.setState( { modal: true } );
		}

		closeModal() {
			this.setState( { modal: false } );
		}

		componentDidMount() {
			this.anchorRef = getRange();
		}

		componentDidUpdate( prevProps ) {
			// When the popover is open or when the selected image changes,
			// update the anchorRef.
			if (
				( ! prevProps.isObjectActive && this.props.isObjectActive ) ||
				prevProps.activeObjectAttributes.url !==
					this.props.activeObjectAttributes.url
			) {
				this.anchorRef = getRange();
			}
		}

		render() {
			const {
				value,
				onChange,
				onFocus,
				isObjectActive,
				activeObjectAttributes,
			} = this.props;

			return (
				<MediaUploadCheck>
					<RichTextToolbarButton
						icon={
							<SVG
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
							>
								<Path d="M4 16h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2zM4 5h10v9H4V5zm14 9v2h4v-2h-4zM2 20h20v-2H2v2zm6.4-8.8L7 9.4 5 12h8l-2.6-3.4-2 2.6z" />
							</SVG>
						}
						title={ title }
						onClick={ this.openModal }
						isActive={ isObjectActive }
					/>
					{ this.state.modal && (
						<MediaUpload
							allowedTypes={ ALLOWED_MEDIA_TYPES }
							onSelect={ ( { id, url, alt, width } ) => {
								this.closeModal();
								onChange(
									insertObject( value, {
										type: name,
										attributes: {
											className: `wp-image-${ id }`,
											style: `width: ${ Math.min(
												width,
												150
											) }px;`,
											url,
											alt,
										},
									} )
								);
								onFocus();
							} }
							onClose={ this.closeModal }
							render={ ( { open } ) => {
								open();
								return null;
							} }
						/>
					) }
					{ isObjectActive && (
						<Popover
							position="bottom center"
							focusOnMount={ false }
							anchorRef={ this.anchorRef }
						>
							{
								// Disable reason: KeyPress must be suppressed so the block doesn't hide the toolbar
								/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
							 }
							<form
								className="block-editor-format-toolbar__image-container-content"
								onKeyPress={ stopKeyPropagation }
								onKeyDown={ this.onKeyDown }
								onSubmit={ ( event ) => {
									const newReplacements = value.replacements.slice();

									newReplacements[ value.start ] = {
										type: name,
										attributes: {
											...activeObjectAttributes,
											style: `width: ${ this.state.width }px;`,
										},
									};

									onChange( {
										...value,
										replacements: newReplacements,
									} );

									event.preventDefault();
								} }
							>
								<TextControl
									className="block-editor-format-toolbar__image-container-value"
									type="number"
									label={ __( 'Width' ) }
									value={ this.state.width }
									min={ 1 }
									onChange={ this.onChange }
								/>
								<Button
									icon={ keyboardReturn }
									label={ __( 'Apply' ) }
									type="submit"
								/>
							</form>
							{ /* eslint-enable jsx-a11y/no-noninteractive-element-interactions */ }
						</Popover>
					) }
				</MediaUploadCheck>
			);
		}
	},
};
