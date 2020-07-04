import React from 'react';
import { Map, GeoCoder } from './lib';

class Maps extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            
        }
        this.mapbox = null;
        this.map = null;
        this.geocoder = null;
        this.location = null;
        this.mapContainer = React.createRef();
    }

    componentDidMount() {
        const { accessToken, zoom, center } = this.props;
        const self = this;
        this.mapbox = new Map(this.mapContainer, {
            accessToken: accessToken,
            zoom: zoom != undefined ? zoom : 11,
            center: center != undefined ? center : [-9.1952226, 38.7436214],
            templateLoading: this.props.templateLoading
        });

        if (self.props.getLocationIp) {
            self.mapbox.getLocationsIp()
                .then(res => {
                    let query = { latitude: res.latitude, longitude: res.longitude, shortcode: res.country_code } 
                    this.location = query
                    self.mapbox.flyTo({zoom:6,...query})
                });

        } else {
            let query = self.mapQuery(self.mapbox.map.getCenter());
            this.location = query

            self.mapbox.flyTo({zoom:6,...query})
        }

        this.mapLoad();
        this.objectMap();
        this.templateMarker();
        this.setZoom();
        this.setZoomMarker();
        this.geo();
        this.getLocationIP();
        this.loading();
    }

    loading() {
        if (this.props.loading) {
            this.mapbox.loading(true);
        }
    }

    getLocation(){
        return this.location;
    }

    mapLoad() {
        const self = this;
        this.mapbox.on('load', async () => {
            if (self.props.loadMap != undefined) {
                self.props.loadMap(self.getLocation())
            }
        })
    }

    mapQuery(obj) {
        return ({
            latitude: obj.lat,
            longitude: obj.lng,
            shortcode: obj.shortcode || 'US'
        })
    }

    objectMap() {
        if (this.props.map != undefined) {
            this.props.map(this.mapbox);
        }
    }

    templateMarker() {
        if (this.props.templateMarker != undefined) {
            this.mapbox.setTemplateMarker(this.props.templateMarker);
        }
    }

    getLocationIP() {
        if (this.props.getLocationIp) {
            this.mapbox.getLocationsIp().then(res => {

            })
        }
    }

    setZoom() {
        if (this.props.zoom != undefined) {
            this.mapbox.setZoom(this.props.zoom);
        }
    }

    setZoomMarker() {
        if (this.props.zoomMaker != undefined) {
            this.mapbox.setZoomMarker(this.props.zoomMaker);
        }
    }

    geo() {
        const self = this;
        this.geocoder = new GeoCoder();
        this.geocoder.on('result', result => {
            if (this.props.loading) {
                self.mapbox.loading(true);
            }
            if (self.props.geoCoderResult != undefined) {
                const { geometry, context } = result.result;
                result['query'] = {
                    latitude: geometry.coordinates[1],
                    longitude: geometry.coordinates[0],
                    shortcode: context[context.length - 1].short_code.toUpperCase()
                }
                self.props.geoCoderResult(result);
            }
        })

        this.mapbox.geocoder(this.geocoder, 'geo');
    }

    render() {
        return (
            <div ref={el => this.mapContainer = el} className="container-map" />
        )
    }
}

class InputGeoCoder extends React.Component {
    render() {
        return (
            <div id="geo" className="geo-map"></div>
        )
    }
}


const RiaMap = {
    Maps,
    InputGeoCoder
}


export default RiaMap;