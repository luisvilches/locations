import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import './mapbox.css';


class MapboxRia {
    constructor(container, opt = {}) {
        this.popup = new PopupLoading(opt.templateLoading);
        this.mapboxgl = mapboxgl;
        this.mapboxgl.accessToken = opt.accessToken || '';
        this.map = new this.mapboxgl.Map({
            container: container,
            style: opt.urlStyle || 'mapbox://styles/mapbox/light-v8',
            zoom: Number.isInteger(opt.zoom) ? opt.zoom : 6,
            center: opt.center || [-9.1952226, 38.7436214],
        });
        this.bounds = new this.mapboxgl.LngLatBounds();
        this.allMarkers = [];
        this.zoomMarker = Number.isInteger(opt.zoomMarker) ? opt.zoomMarker : 16;
        this.classSelectMarker = isString(opt.classSelectMarker) ? opt.classSelectMarker : 'select-marker-map';
        this.templateMarker = isString(opt.templateMarker) ? opt.templateMarker : '📌';
    }

    loading(bool) {
        if (bool) {
            this.map.addControl(this.popup);
        } else {
            this.map.removeControl(this.popup);
        }
    }

    flyTo(e) {
        this.map.flyTo({ center: [e.longitude, e.latitude], zoom: e.zoom || this.zoomMarker });
    }

    setTemplateMarker(template) {
        if (isString(template)) {
            this.templateMarker = template;
        }
    }

    setZoomMarker(zoom) {
        if (Number.isInteger(zoom)) this.zoomMarker = zoom;
    }

    geocoder(geo, container) {
        if (document.getElementById(container) != null && container) {
            geo.addTo('#' + container);
        } else {
            this.map.addControl(geo);
        }
    }

    fitBounds(bounds, opt = { maxZoom: 16, padding: { top: 50, bottom: 50, left: 50, right: 50 }, easing(t) { return t * (2 - t) } }) {
        this.map.fitBounds(bounds, opt);
    }

    on(event, callback) {
        this.map.on(event, callback);
    }

    addMarker(marker, callback) {
        const markerEl = document.createElement('div');
        markerEl.innerHTML = this.templateMarker;
        let self = this;
        let _id = Math.random().toString(36).slice(-8);
        markerEl.addEventListener('click', function () {
            self.map.flyTo({
                center: marker.geometry.coordinates,
                zoom: self.zoomMarker
            })

            self.selectMarker(_id);

            if (callback != undefined) callback()
        })

        this.bounds.extend(marker.geometry.coordinates);

        let mrk = new this.mapboxgl.Marker(markerEl, { offset: [5, -5] });
        mrk.setLngLat(marker.geometry.coordinates);
        mrk.addTo(this.map);
        mrk['_id'] = _id;
        this.allMarkers.push(mrk);
        return mrk;
    }

    arrayToGeoJSON(arrays) {
        var features = [];
        arrays.forEach(function (array) {
            const { latitude, longitude, ...rest } = array;
            var feature = {
                'type': 'Feature',
                'properties': rest,
                'geometry': {
                    'type': 'Point',
                    'coordinates': [longitude, latitude]
                }
            };
            features.push(feature);
        });
        return {
            'type': 'FeatureCollection',
            'features': features
        };
    }

    markers(data) {
        let i = 0;
        var self = this;
        while (i < data.features.length) {
            self.addMarker(data.features[i]);
            i++;
        }
    }

    clearAllMarkers() {
        for (var i = this.allMarkers.length - 1; i >= 0; i--) {
            this.allMarkers[i].remove();
        }
    }

    traslateByData(data) {
        this.clearAllMarkers();
        this.markers(data);
        let bounds = data.features.map((coords) => [coords.geometry.coordinates[0], coords.geometry.coordinates[1]])
        this.fitBounds(this.boundingBox(bounds));
    }

    selectMarker(id) {
        let marker = this.allMarkers[this.allMarkers.findIndex(e => e._id == id)];
        this.allMarkers.map(e => e._element.classList.remove(this.classSelectMarker))
        marker._element.classList.add(this.classSelectMarker);
    }

    getLocationsIp() {
        var self = this;
        return new Promise((resolve, reject) => {
            fetch('https://geolocation-db.com/json/')
                .then(res => res.json())
                .then(response => {
                    resolve(response);
                })
                .catch(err => resolve({ longitud: self.center[1], latitude: self.center[0], shortcode: 'US' }))
        })
    }

    async getLocationsIpAsync() {
        return await this.getLocationsIp();
    }

    boundingBox(arr) {
        if (!Array.isArray(arr) || !arr.length) return undefined;

        let w, s, e, n;
        arr.forEach((point) => {
            if (w === undefined) {
                n = s = point[1];
                w = e = point[0];
            }

            if (point[1] > n) n = point[1];
            else if (point[1] < s) s = point[1];

            if (point[0] > e) e = point[0];
            else if (point[0] < w) w = point[0];
        });
        return [[w, s], [e, n]]
    }
}

class GeoCoderRia {
    constructor(opt = {}) {
        this.options = {};
        this.options['accessToken'] = mapboxgl.accessToken;
        this.options['mapboxgl'] = mapboxgl;
        this.options['types'] = opt.type != undefined ? opt.type : '';

        if (opt.localGeocoder != null || opt.localGeocoder != undefined) {
            this.options['localGeocoder'] = this.forwardGeocoder;
        }

        if (opt.templateCustomGeoCoder != null || opt.templateCustomGeoCoder != undefined) {
            this.options['render'] = function (item) {
                item['icon'] = item.properties.maki || 'marker';
                return this.tmp(opt.templateCustomGeoCoder, item)
            }
        }

        this.geocoder = new MapboxGeocoder(this.options);
        return this.geocoder;
    }

    on(event, callback) {
        this.geocoder.on(event, callback);
    }

    forwardGeocoder(query) {
        var matchingFeatures = [];
        for (var i = 0; i < this.options.localGeocoder.features.length; i++) {
            var feature = this.options.localGeocoder.features[i];
            if (
                feature.properties.title
                    .toLowerCase()
                    .search(query.toLowerCase()) !== -1
            ) {
                feature['place_name'] = feature.properties.title;
                feature['center'] = feature.geometry.coordinates;
                feature['place_type'] = ['park'];
                matchingFeatures.push(feature);
            }
        }
        return matchingFeatures;
    }

    tmp(template, data) {
        const pattern = /{{\s*(\w+?)\s*}}/g;
        return template.replace(pattern, (_, token) => data[token] || '');
    }
}

const isString = str => typeof str === 'string' ? true : false;

class PopupLoading {
    constructor(template) {
        this.template = template || '<h4>Loading</h4>';
    }
    onAdd(map) {
        this.map = map;
        this.container = document.createElement('div');
        this.container.className = "popup-loading";
        this.container.innerHTML = this.template;
        return this.container;
    }
    onRemove() {
        this.container.parentNode.classList.add('removex')
        setTimeout(() => {
            this.container.parentNode.classList.remove('remove')
            this.container.parentNode.removeChild(this.container);
            this.map = undefined;
        }, 100)
    }
}



export const Map = MapboxRia;
export const GeoCoder = GeoCoderRia;



