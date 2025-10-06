import L from 'leaflet'
import 'leaflet.markercluster'

const defaultOptions = {
    mapOptions: {
        'zoom': 15,
        'zIndex': 0,
        'scrollWheelZoom': false,
        'dragging': !L.Browser.mobile,
        'showCoverageOnHover': false,
    }
}

const defaultMarkerOptions = {
    'title': '',
    'address': '',
    'centerOnClick': true,
    'size': {
        'width': 33,
        'height': 44,
    },
    'anchor': {
        x: 16,
        y: 44,
    },
    'showPopup': true,
}

class Map {
    /**
     * Create and insert a Leaflet Map into HTML containers
     * @constructor
     * @param {string} selector - Id of HTML container that will hold the map
     * @param {Object} options - Object with map options and markers to initialize the map
     * @param {{lat: Number, lng: Number, zoom: Number, zIndex: Number, scrollWheelZoom: boolean, showCoverageOnHover: boolean}} options.mapOptions - Options used to initializate the map
     * @param {{title: String, icon: String, address: String, position: { lat: Number, lng: Number}}[]} options.markers - Markers that will be added in the map
     * @param {String} markers[].title - Marker title and alt that describes the place
     * @param {String} markers[].icon - Url where the marker icon can been founded
     * @param {String} markers[].address - Address shown on marker popup
     * @param {Boolean} markers[].showPopup - Choose whether show marker popup or not
     * @param {Boolean} markers[].centerOnClick - Center map to marker when clicked
     * @param {String} markers[].customPopup - Custom popup content
     * @param {Number} markers[].position.lat - Latitude where the marker will be placed
     * @param {Number} markers[].position.lng - Longitude where the marker will be placed
     * @param {Number} markers[].size.width - Marker width
     * @param {Number} markers[].size.height - Marker height
     * @param {Number} markers[].anchor.x - Marker anchor x
     * @param {Number} markers[].anchor.y - Marker anchor y
     */
    constructor(selector, options) {
        this.selector = selector

        this.options = {
            ...options,
            mapOptions: {
                ...defaultOptions.mapOptions,
                ...options.mapOptions,
            },
        }

        this.map = null
        this.markers = []

        this.#init()
    }

    #init() {
        this.#addTileLayer()
        this.#addMarkerClusterLayer()
        this.options.markers?.forEach(marker => {
            this.addMarker(marker)
        })
        this.#initMap()
    }

    #initMap() {
        const { lat, lng, zoom, zIndex, scrollWheelZoom, dragging } = this.options.mapOptions

        this.map = L.map(this.selector, { scrollWheelZoom: scrollWheelZoom, dragging: dragging }).setView([lat, lng], zoom)
        this.map._container.style.zIndex = zIndex

        this.map.addLayer(this.tileLayer)
        this.map.addLayer(this.markerCluster)
        this.map.fitBounds(this.markerCluster.getBounds())
        this.map.setZoom(this.options.mapOptions.zoom)
    }

    #addTileLayer() {
        this.tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 20,
            subdomains: 'abcd',
            attribution: '&copy; <a target="_blank" rel="noopener noreferrer" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a target="_blank" rel="noopener noreferrer" href="https://carto.com/attributions">CARTO</a>'
        })
    }

    #addMarkerClusterLayer() {
        const { showCoverageOnHover } = this.options.mapOptions
        this.markerCluster = L.markerClusterGroup({ showCoverageOnHover: showCoverageOnHover})
    }

    #markerListener(marker, centerOnClick) {
        marker?.addEventListener('click', () => {
            if (centerOnClick) this.map.panTo(marker.getLatLng())

            this.map._container.querySelector('.leaflet-popup-close-button')?.addEventListener('click', (ev) => {
                ev.preventDefault()
            })
        })
    }

    /**
     * Add a new marker to the map
     * @param {Object} marker - Marker that will be added in the map
     * @param {String} marker.title - Marker title and alt that describes the place
     * @param {String} marker.icon - Url where can the marker icon been founded
     * @param {String} marker.address - Address shown on marker popup
     * @param {String} marker.customPopup - Custom popup content
     * @param {boolean} marker.showPopup - Choose whether show marker popup or not
     * @param {boolean} marker.centerOnClick - Center map to marker when clicked
     * @param {Number} marker.position.lat - Latitude where the marker will be placed
     * @param {Number} marker.position.lng - Longitude where the marker will be placed
     * @param {Number} marker.size.width - Marker width
     * @param {Number} marker.size.height - Marker height
     * @param {Number} marker.anchor.x - Marker anchor x
     * @param {Number} marker.anchor.y - Marker anchor y
     */
     addMarker(marker) {
        marker = { ...defaultMarkerOptions, ...marker }

        const { title, icon, showPopup } = marker
        const { lat, lng } = marker.position
        const { width, height } = marker.size
        const { x: anchorX, y: anchorY } = marker.anchor
        const markerIcon = L.icon({
            iconUrl: icon,
            iconSize: [width, height],
            iconAnchor: [anchorX, anchorY],
            riseOnHover: true,
        })

        const mapMarker = L.marker([lat, lng], {icon: markerIcon, alt: title, title: title}).addTo(this.markerCluster)

        this.markers.push(mapMarker)

        if (showPopup) {
            this.addPopup(marker, mapMarker)
        }

        this.#markerListener(mapMarker, marker.centerOnClick)
    }

    addPopup(marker, mapMarker) {
        const { title, address, customPopup } = marker

        if (customPopup) {
            mapMarker.bindPopup(customPopup)
        } else if (title || address) {
            mapMarker.bindPopup(`<b>${title}</b><div>${address}</div>`)
        }
    }

    removeMarker(index) {
        this.markerCluster.removeLayer(this.markers[index])
        this.markers.splice(index, 1);
    }
}

export default Map
