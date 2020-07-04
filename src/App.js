import React, { useState } from 'react';
import RiaMap from './mapbox/mapbox';
import Cookies from 'universal-cookie'
import axios from 'axios'

const token = 'pk.eyJ1IjoiY2Fzc2l1c2hyIiwiYSI6ImNrYTdqaXl3dzAwNDYydW52MjlvMzVscXoifQ.0IYXaBawoM0QH1auXSyqrg';
const markerIcon = `
<svg width="33" height="44" viewBox="0 0 33 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
        d="M3.19597 24.1535L3.19594 24.1535L3.20023 24.1609L12.334 39.9689C13.1222 41.382 14.6562 42.0251 16.0213 42.0251C17.4183 42.0251 18.8615 41.3604 19.6927 39.9958L19.6987 39.986L19.7044 39.9761L28.8421 24.1706L28.8422 24.1706L28.8449 24.1658C30.1237 21.9253 31.0425 19.2202 31.0425 16.2602C31.0425 7.95172 24.3316 1.22974 16.0213 1.22974C7.71173 1.22974 1 7.94147 1 16.251C1 19.1645 1.92846 21.9156 3.19597 24.1535ZM16.0213 19.3926C13.7561 19.3926 11.903 17.5394 11.903 15.2743C11.903 13.0092 13.7561 11.156 16.0213 11.156C18.2864 11.156 20.1395 13.0092 20.1395 15.2743C20.1395 17.5476 18.2876 19.3926 16.0213 19.3926Z"
        fill="#FF6100" stroke="white" strokeWidth="2" />
    <circle cx="16" cy="15" r="4" fill="white" />
</svg>
`;

const templateLoading = `<div class="wrapper">
<div class="loader-6 center"><span></span></div>
<h4>Find locations</h4>
</div>`

function App() {
  const cookies = new Cookies()
  const [map, setMap] = useState({})
  const [locationsData, setLocationsData] = useState([])

  const mapQuery = (query) => ({
    countryTo: query.shortcode,
    findLocationType: 'RMT',
    lat: '',
    latitude: query.latitude,
    long: '',
    longitude: query.longitude,
    PayAgentId: null,
    RequestCountry: 'US',
    RequiredPayoutAgents: false,
    RequiredReceivingAgents: false,
    RequiredReceivingAndPayoutAgents: false,
  })

  const result = (data) => {
    const { query } = data;
    axios
      .put(
        'https://riamoneytransfer.com/api/location/agent-locations',
        mapQuery(query),
        {
          headers: {
            Authorization: 'Bearer ' + cookies.get('TOKEN'),
            CultureCode: 'en-US',
            IsoCode: 'US',
          },
        }
      )
      .then((res) => {
        setLocationsData(res.data)
        map.traslateByData(map.arrayToGeoJSON(res.data))
        map.loading(false);
      })
  }


  const load = (query) => {
    axios
      .get('https://riamoneytransfer.com/api/Authorization/session', {
        headers: {
          CultureCode: 'en-US',
          IsoCode: 'US',
        },
      })
      .then((res) => {
        cookies.set('TOKEN', res.data.authToken.jwtToken, { path: '/' })
        axios
          .put(
            'https://riamoneytransfer.com/api/location/agent-locations',
            mapQuery(query),
            {
              headers: {
                Authorization: 'Bearer ' + cookies.get('TOKEN'),
                CultureCode: 'en-US',
                IsoCode: 'US',
              },
            }
          )
          .then((res) => {
            setLocationsData(res.data)
            map.traslateByData(map.arrayToGeoJSON(res.data))
            map.loading(false);
          })
      })
  }

  return (
    <div className="App">

      <div className="container-fluid">
        <div className="row p-0">
          <div className="col-md-3 pt-2">
            <RiaMap.InputGeoCoder />

            <ul style={{padding:0,margin:"10px auto"}} className="markers">
              {locationsData.length > 0 ? locationsData.map((e,i) => {
                return (
                <li key={i}  style={{listStyle:'none',borderBottom:'1px solid #eee',padding:10,cursor:'pointer'}} onClick={() => map.flyTo({latitude:e.latitude,longitude:e.longitude,zoom:17})}>
                  <h6 style={{fontSize:14}}><strong>{e.name}</strong></h6>
                  <p style={{fontSize:12}}>{e.address}</p>
                </li>
                )
              }):<div style={{position:'relative',paddingTop:40}} dangerouslySetInnerHTML={{__html: templateLoading}}></div>}
            </ul>

          </div>
          <div className="col-md-9 p-0">
            <RiaMap.Maps
              map={e => setMap(e)}
              loadMap={load}
              accessToken={token}
              geoCoderResult={result}
              templateMarker={markerIcon}
              center={[-104.993966, 39.738416]}
              loading={true}
              templateLoading={templateLoading}
              getLocationIp={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
