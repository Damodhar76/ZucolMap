import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  StatusBar,
} from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { NativeModules } from 'react-native';
import {
  Provider as PaperProvider,
  Appbar,
  Snackbar,
  Text,
  useTheme,
  Button,
} from 'react-native-paper';

const { BatteryModule } = NativeModules;

const App = () => {
  const [region, setRegion] = useState({
    latitude: 28.7041,
    longitude: 77.1025,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [pathCoordinates, setPathCoordinates] = useState([]);
  const [batterySaverStatus, setBatterySaverStatus] = useState(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const theme = useTheme();

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  useEffect(() => {
    const fetchLocation = async () => {
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        Geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setPathCoordinates((prev) => [
              ...prev,
              { latitude, longitude },
            ]);
            setRegion((prevRegion) => ({
              ...prevRegion,
              latitude,
              longitude,
            }));
          },
          (error) => console.error(error),
          { enableHighAccuracy: true, distanceFilter: 10, interval: 600000 } // Every 10 mins
        );
      }
    };

    fetchLocation();
  }, []);

  useEffect(() => {
    BatteryModule.isBatterySaverEnabled()
      .then((enabled) => setBatterySaverStatus(enabled))
      .catch((error) => console.error('Battery module error: ', error));
  }, []);

  return (
    <PaperProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
      />
      <Appbar.Header>
        <Appbar.Content title="Enhanced Map App" />
      </Appbar.Header>
      <View style={styles.container}>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'Dismiss',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          Battery Saver Mode is {batterySaverStatus ? 'Enabled' : 'Disabled'}
        </Snackbar>

        <GooglePlacesAutocomplete
          placeholder="Search for a location"
          fetchDetails={true}
          onPress={(data, details = null) => {
            const { lat, lng } = details.geometry.location;
            setRegion({
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
            setPathCoordinates([{ latitude: lat, longitude: lng }]);
          }}
          query={{
            key: 'YOUR_API_KEY',
            language: 'en',
          }}
          styles={{
            container: {
              flex: 0,
              zIndex: 1,
              position: 'absolute',
              top: 100,
              width: '90%',
              alignSelf: 'center',
            },
            listView: { backgroundColor: 'white' },
          }}
        />

        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={(region) => setRegion(region)}
        >
          {pathCoordinates.length > 0 && (
            <Polyline
              coordinates={pathCoordinates}
              strokeColor={theme.colors.primary}
              strokeWidth={3}
            />
          )}

          {pathCoordinates.map((coord, index) => (
            <Marker key={index} coordinate={coord} />
          ))}
        </MapView>

        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={() => setSnackbarVisible(true)}
            style={styles.button}
          >
            Show Battery Status
          </Button>
        </View>
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  button: {
    backgroundColor: '#6200EE',
  },
});

export default App;
