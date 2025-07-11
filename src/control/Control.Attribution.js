import {Control} from './Control.js';
import {Map} from '../map/Map.js';
import * as Util from '../core/Util.js';
import * as DomEvent from '../dom/DomEvent.js';
import * as DomUtil from '../dom/DomUtil.js';

const ukrainianFlag = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" class="leaflet-attribution-flag"><path fill="#4C7BE1" d="M0 0h12v4H0z"/><path fill="#FFD500" d="M0 4h12v3H0z"/><path fill="#E0BC00" d="M0 7h12v1H0z"/></svg>';


/*
 * @class Control.Attribution
 * @inherits Control
 *
 * The attribution control allows you to display attribution data in a small text box on a map. It is put on the map by default unless you set its [`attributionControl` option](#map-attributioncontrol) to `false`, and it fetches attribution texts from layers with the [`getAttribution` method](#layer-getattribution) automatically. Extends Control.
 */

// @namespace Control.Attribution
// @constructor Control.Attribution(options: Control.Attribution options)
// Creates an attribution control.
export const Attribution = Control.extend({
	// @section
	// @aka Control.Attribution options
	options: {
		// @option position: String = 'bottomright'
		// The position of the control (one of the map corners). Possible values are `'topleft'`,
		// `'topright'`, `'bottomleft'` or `'bottomright'`
		position: 'bottomright',

		// @option prefix: String|false = 'Leaflet'
		// The HTML text shown before the attributions. Pass `false` to disable.
		prefix: `<a target="_blank" href="https://leafletjs.com" title="A JavaScript library for interactive maps">${ukrainianFlag}Leaflet</a>`
	},

	initialize(options) {
		Util.setOptions(this, options);

		this._attributions = {};
	},

	onAdd(map) {
		map.attributionControl = this;
		this._container = DomUtil.create('div', 'leaflet-control-attribution');
		DomEvent.disableClickPropagation(this._container);

		// TODO ugly, refactor
		for (const layer of Object.values(map._layers)) {
			if (layer.getAttribution) {
				this.addAttribution(layer.getAttribution());
			}
		}

		this._update();

		map.on('layeradd', this._addAttribution, this);

		return this._container;
	},

	onRemove(map) {
		map.off('layeradd', this._addAttribution, this);
	},

	_addAttribution(ev) {
		if (ev.layer.getAttribution) {
			this.addAttribution(ev.layer.getAttribution());
			ev.layer.once('remove', () => this.removeAttribution(ev.layer.getAttribution()));
		}
	},

	// @method setPrefix(prefix: String|false): this
	// The HTML text shown before the attributions. Pass `false` to disable.
	setPrefix(prefix) {
		this.options.prefix = prefix;
		this._update();
		return this;
	},

	// @method addAttribution(text: String): this
	// Adds an attribution text (e.g. `'&copy; OpenStreetMap contributors'`).
	addAttribution(text) {
		if (!text) { return this; }

		if (!this._attributions[text]) {
			this._attributions[text] = 0;
		}
		this._attributions[text]++;

		this._update();

		return this;
	},

	// @method removeAttribution(text: String): this
	// Removes an attribution text.
	removeAttribution(text) {
		if (!text) { return this; }

		if (this._attributions[text]) {
			this._attributions[text]--;
			this._update();
		}

		return this;
	},

	_update() {
    if (!this._map) { return; }

    const attribs = Object.keys(this._attributions).filter(i => this._attributions[i]);

    const prefixAndAttribs = [];

    if (this.options.prefix) {
        prefixAndAttribs.push(this.options.prefix);
    }
    if (attribs.length) {
        prefixAndAttribs.push(attribs.join(', '));
    }

    // Clear container safely
    this._container.textContent = '';

    // Build DOM manually instead of using innerHTML for Trusted Types compatibility
    for (let i = 0; i < prefixAndAttribs.length; i++) {
        if (i > 0) {
            // Add separator: ' | '
            this._container.appendChild(document.createTextNode(' '));
            const separator = DomUtil.create('span', '', this._container);
            separator.setAttribute('aria-hidden', 'true');
            separator.textContent = '|';
            this._container.appendChild(document.createTextNode(' '));
        }

        if (i === 0 && this.options.prefix && this.options.prefix.includes('leafletjs.com')) {
            // Build the default Leaflet prefix manually
            const link = DomUtil.create('a', '', this._container);
            link.target = '_blank';
            link.href = 'https://leafletjs.com';
            link.title = 'A JavaScript library for interactive maps';
            
            // Create Ukrainian flag SVG manually
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            svg.setAttribute('width', '12');
            svg.setAttribute('height', '8');
            svg.setAttribute('viewBox', '0 0 12 8');
            svg.setAttribute('class', 'leaflet-attribution-flag');
            
            const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path1.setAttribute('fill', '#4C7BE1');
            path1.setAttribute('d', 'M0 0h12v4H0z');
            
            const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path2.setAttribute('fill', '#FFD500');
            path2.setAttribute('d', 'M0 4h12v3H0z');
            
            const path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path3.setAttribute('fill', '#E0BC00');
            path3.setAttribute('d', 'M0 7h12v1H0z');
            
            svg.appendChild(path1);
            svg.appendChild(path2);
            svg.appendChild(path3);
            
            link.appendChild(svg);
            link.appendChild(document.createTextNode('Leaflet'));
        } else {
            // For attribution text or custom prefix, use safe text content
            this._container.appendChild(document.createTextNode(prefixAndAttribs[i]));
        }
    }
}
});

// @namespace Map
// @section Control options
// @option attributionControl: Boolean = true
// Whether a [attribution control](#control-attribution) is added to the map by default.
Map.mergeOptions({
	attributionControl: true
});

Map.addInitHook(function () {
	if (this.options.attributionControl) {
		new Attribution().addTo(this);
	}
});
