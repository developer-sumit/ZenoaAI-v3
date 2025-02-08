import React from 'react';
import RNFS from 'react-native-fs';
import {
  Image,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/Ionicons';
import {useToast} from '@zenoa/components/Toast';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

import {
  RewardedAd,
  TestIds,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import appConfig from '@zenoa/config/app.config';

const rewarded = RewardedAd.createForAdRequest(TestIds.REWARDED);

const ImageViewer = ({
  uri,
  onPress,
  onClose,
}: {
  uri: string | null;
  onPress?: () => void;
  onClose?: () => void;
}) => {
  const toast = useToast();

  const [downloading, setDownloading] = React.useState(false);
  const [isAdLoaded, setIsAdLoaded] = React.useState(false);
  const [rewardReceived, setRewardReceived] = React.useState(false);

  React.useEffect(() => {
    const loadedListener = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => setIsAdLoaded(true),
    );
    const rewardListener = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        setRewardReceived(true);
        // If user just earned reward, start download now
        console.log('Reward received, downloading image...');
        if (uri) {
          downloadImage(uri.split(',')[1]);
        }
      },
    );

    rewarded.load();

    return () => {
      loadedListener();
      rewardListener();
      rewarded.removeAllListeners();
    };
  }, []);

  const showRewardedAd = () => {
    if (isAdLoaded) {
      rewarded.show();
    } else {
      rewarded.load(); // Try loading again if not loaded
    }
  };

  const handleDownloadPress = () => {
    if (rewardReceived && uri) {
      downloadImage(uri.split(',')[1]); // Already rewarded => download
    } else {
      showRewardedAd(); // Show ad if user hasn't earned reward
    }
  };

  // const checkPermission = async () => {
  //   if (Platform.OS === 'ios') {
  //     return true; // iOS handles permissions differently
  //   }

  //   if (Number(Platform.Version) >= 33) {
  //     // Android 13+
  //     const permission = PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
  //     const result = await check(permission);

  //     if (result === RESULTS.DENIED) {
  //       const permissionRequest = await request(permission);
  //       return permissionRequest === RESULTS.GRANTED;
  //     }
  //     return result === RESULTS.GRANTED;
  //   } else {
  //     const permission = PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;
  //     const result = await check(permission);

  //     if (result === RESULTS.DENIED) {
  //       const permissionRequest = await request(permission);
  //       return permissionRequest === RESULTS.GRANTED;
  //     }
  //     return result === RESULTS.GRANTED;
  //   }
  // };

  // Add download handler
  const downloadImage = async (base64: string) => {
    try {
      // const hasPermission = await checkPermission();
      // if (!hasPermission) {
      //   toast.error(`Please grant storage permission to download images!`, {
      //     duration: 2000,
      //     position: 'top',
      //   });
      //   return;
      // }

      setDownloading(true);

      const fileName = `${appConfig.name.replace(
        /\s/g,
        '_',
      )}_${Date.now()}.jpg`;
      const appFolder = appConfig.name.replace(/\s/g, '');
      const path =
        Platform.OS === 'ios'
          ? `${RNFS.DocumentDirectoryPath}/${appFolder}`
          : `${RNFS.PicturesDirectoryPath}/${appFolder}`;

      // Ensure the directory exists
      await RNFS.mkdir(path);

      const filePath = `${path}/${fileName}`;

      await RNFS.writeFile(filePath, base64, 'base64');
      if (Platform.OS === 'android') {
        await RNFS.scanFile(filePath)
          .then(() => {
            console.log('Scan file success');
          })
          .catch((err: Error) => {
            console.log('Scan file error', err);
          });
      }

      toast.success(`Download Complete!`, {
        duration: 2000,
        position: 'top',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image!', {
        duration: 2000,
        position: 'top',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal visible={!!uri} transparent>
      <BlurView
        style={{flex: 1}}
        blurType="dark"
        blurAmount={20}
        reducedTransparencyFallbackColor="white">
        <TouchableOpacity
          activeOpacity={0.8}
          className="flex-1 justify-center items-center p-4"
          onPress={onPress}>
          <Image
            source={{uri: uri!}}
            style={{borderRadius: 20, width: '100%', height: '100%'}}
            resizeMode="contain"
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleDownloadPress}
            disabled={downloading}
            className="absolute bottom-6 w-[70%] h-16 bg-light-primary dark:bg-dark-primary rounded-2xl flex-row items-center justify-center self-center">
            <Icon
              name={downloading ? 'cloud-download' : 'download-outline'}
              size={24}
              color="white"
            />
            <Text className="ml-2 font-semibold text-white">Download</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="absolute top-4 right-4 bg-white/90 p-2 rounded-full"
            onPress={onPress}>
            <Icon name="close" size={24} color="#4f46e5" />
          </TouchableOpacity>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
};

export default ImageViewer;
