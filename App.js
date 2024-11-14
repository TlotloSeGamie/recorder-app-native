import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, Button, View, Modal, Pressable, TouchableOpacity, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [recordings, setRecordings] = useState([]);
  const [recording, setRecording] = useState(null);
  const [recordingName, setRecordingName] = useState('');
  const [playing, setPlaying] = useState(-1);
  const [sound, setSound] = useState(null);
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const waveformScale = useState(new Animated.Value(1))[0];
  const waveformHeights = [
    useState(new Animated.Value(0.8))[0],
    useState(new Animated.Value(1))[0],
    useState(new Animated.Value(0.9))[0],
    useState(new Animated.Value(0.7))[0],
    useState(new Animated.Value(1.1))[0],
  ];

  useEffect(() => {
    const checkUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setIsLogin(false);
      }
    };
    checkUser();
  }, []);

  const handleLogin = async () => {
    if (email && password) {
      await AsyncStorage.setItem('user', JSON.stringify({ email }));
      setIsLogin(false);
    } else {
      console.log('Please provide valid email and password');
    }
  };

  const handleSignup = async () => {
    if (name && email && password) {
      await AsyncStorage.setItem('user', JSON.stringify({ name, email }));
      setIsLogin(false);
    } else {
      console.log('Please provide valid name, email, and password');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    setIsLogin(true);
  };

  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);

      Animated.loop(
        Animated.sequence([
          Animated.timing(waveformScale, {
            toValue: 1.2,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(waveformScale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();

      waveformHeights.forEach((height, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(height, {
              toValue: Math.random() * 1.2 + 0.7, 
              duration: 300 + Math.random() * 100, 
              useNativeDriver: true,
            }),
            Animated.timing(height, {
              toValue: Math.random() * 1.2 + 0.7,
              duration: 300 + Math.random() * 100,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    setIsRecording(false);
    setDialogVisible(true);

    waveformScale.stopAnimation();
    waveformHeights.forEach((height) => {
      height.stopAnimation();
    });
  }

  const handleSaveRecording = () => {
    if (recordingName.trim() !== '') {
      const timestamp = new Date().toLocaleString();
      setRecordings([
        ...recordings,
        {
          name: recordingName,
          recording: recording,
          timestamp: timestamp,
        },
      ]);
      setRecording(undefined);
      setDialogVisible(false);
      setRecordingName('');
    }
  };

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const Soundwave = ({ scaleValue }) => {
    return (
      <View style={styles.soundwaveContainer}>
        {waveformHeights.map((height, index) => (
          <Animated.View
            key={index}
            style={[
              styles.waveformBar,
              {
                transform: [{ scaleY: height }, { scaleX: scaleValue }],
                height: height.interpolate({
                  inputRange: [0, 1.5],
                  outputRange: ['30%', '100%'], 
                }),
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      {isLogin ? (
        <View style={styles.form}>
          <Text style={styles.title}>Login</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Button title="Login" onPress={handleLogin} />
          <Text style={styles.link} onPress={() => setIsLogin(false)}>
            Don't have an account? Sign Up
          </Text>
        </View>
      ) : !name ? ( // Signup form
        <View style={styles.form}>
          <Text style={styles.title}>Sign Up</Text>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Button title="Sign Up" onPress={handleSignup} />
          <Text style={styles.link} onPress={() => setIsLogin(true)}>
            Already have an account? Log In
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.form}>
            <Button title="Logout" onPress={handleLogout} />
          </View>

          <Text style={styles.heading}>Voice Recorder</Text>

          {isRecording && <Soundwave scaleValue={waveformScale} />}

          <Modal visible={isDialogVisible} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalText}>Enter Recording Name:</Text>
                <TextInput
                  style={styles.textInput}
                  onChangeText={(text) => setRecordingName(text)}
                  value={recordingName}
                />
                <Pressable style={styles.saveButton} onPress={handleSaveRecording}>
                  <Text style={styles.buttonText}>Save</Text>
                </Pressable>
                <Pressable style={styles.cancelButton} onPress={() => setDialogVisible(false)}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </Modal>

          <View style={styles.list}>
            {recordings.map((recording, index) => (
              <View key={index} style={styles.recordingItem}>
                <TouchableOpacity
                  onPress={async () => {
                    const { sound } = await recording.recording.createNewLoadedSoundAsync(
                      {
                        isLooping: false,
                        isMuted: false,
                        volume: 1.0,
                        rate: 1.0,
                        shouldCorrectPitch: true,
                      }
                    );
                    setSound(sound);
                    setPlaying(index);
                    await sound.playAsync();
                    await sound.setOnPlaybackStatusUpdate(async (status) => {
                      if (status.didJustFinish) {
                        setPlaying(-1);
                        await sound.unloadAsync();
                      }
                    });
                  }}
                  style={styles.playButton}
                >
                  <Ionicons name={playing !== index ? 'play' : 'pause'} size={30} color="white" />
                  <Text style={styles.recordingName}>{recording.name}</Text>
                  <Text style={styles.timestamp}>{recording.timestamp}</Text>
                  <Ionicons
                    name="trash"
                    size={30}
                    color="white"
                    onPress={() => {
                      setRecordings(recordings.filter((rec, i) => i !== index));
                    }}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Pressable style={styles.recordButton} onPress={isRecording ? stopRecording : startRecording}>
              <Ionicons 
                name={isRecording ? "stop" : "mic"} 
                size={40} 
                color="white" 
              />
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090347',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    padding: 25,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 12,
    paddingLeft: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  link: {
    color: 'black',
    marginTop: 12,
    fontSize: 15,
  },
  heading: {
    color: '#ffffff',
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  list: {
    flex: 1,
    width: '100%',
  },
  waveformContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  waveformBar: {
    width: 10,
    backgroundColor: 'white',
    margin: 3,
    borderRadius: 5,
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  textInput: {
    height: 40,
    width: '100%',
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 8,
    borderRadius: 6,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  recordingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  recordingName: {
    fontSize: 16,
    color: 'white',
  },
  timestamp: {
    fontSize: 14,
    color: 'lightgray',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    marginTop: 30,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soundwaveContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
});
