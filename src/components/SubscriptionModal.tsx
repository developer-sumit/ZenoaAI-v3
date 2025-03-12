import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, {useState} from 'react';
import FastImage from 'react-native-fast-image';
import {BlurView} from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated';
import {useThemeStore} from '@src/store/themeStore';
import {theme} from '@src/theme/Theme';
import {useAuthStore} from '@src/store/authStore';
import {useToast} from './Toast';
import appConfig from '@src/config/app.config';

interface SubscriptionPlan {
  id: string;
  name: string;
  icon: string;
  price: string;
  period: string;
  savings?: string;
  isBestValue?: boolean;
  features: string[];
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'yearly',
    name: 'Annual Plan',
    icon: 'stars',
    price: '$99.99',
    period: '/year',
    savings: 'Save 20% compared to monthly',
    isBestValue: true,
    features: [
      'Unlimited AI Generations',
      'Premium Support',
      'Exclusive Styles & Filters',
    ],
  },
  {
    id: 'monthly',
    name: 'Monthly Plan',
    icon: 'flash-on',
    price: '$9.99',
    period: '/month',
    features: ['All Premium Features', 'Cancel Anytime'],
  },
];

const FeatureItem = ({icon, title}: {icon: string; title: string}) => {
  const {isDark} = useThemeStore();
  const colors = isDark ? theme.dark : theme.light;

  return (
    <View className="flex-row items-center py-2">
      <Icon name={icon} size={20} color={colors.primary} />
      <Text style={{color: colors.text}} className="ml-3">
        {title}
      </Text>
    </View>
  );
};

const PlanCard = ({
  plan,
  onSelect,
  isLoading,
}: {
  plan: SubscriptionPlan;
  onSelect: (planId: string) => void;
  isLoading: boolean;
}) => {
  const {isDark} = useThemeStore();
  const colors = isDark ? theme.dark : theme.light;

  return (
    <View
      className={`relative p-5 rounded-2xl ${
        plan.isBestValue ? 'border-2' : 'border'
      }`}
      style={{
        backgroundColor: plan.isBestValue
          ? colors.primary + '10'
          : colors.surface,
        borderColor: plan.isBestValue
          ? colors.primary + '40'
          : colors.surface + '80',
      }}>
      {/* Best value badge */}
      {plan.isBestValue && (
        <View
          className="absolute top-2 right-2 px-2 py-1 rounded-full"
          style={{backgroundColor: colors.primary}}>
          <Text className="text-white text-xs font-medium">Best Value</Text>
        </View>
      )}

      {/* Plan header */}
      <View className="flex-row items-center mb-2">
        <Icon name={plan.icon} size={24} color={colors.primary} />
        <Text
          className="text-lg font-semibold ml-2"
          style={{color: colors.primary}}>
          {plan.name}
        </Text>
      </View>

      {/* Price */}
      <Text className="text-2xl font-bold" style={{color: colors.text}}>
        {plan.price}
        <Text className="text-base ml-1" style={{color: colors.secondaryText}}>
          {plan.period}
        </Text>
      </Text>

      {/* Savings text */}
      {plan.savings && (
        <Text className="text-green-500 text-sm mt-1">{plan.savings}</Text>
      )}

      {/* Features */}
      <View className="mt-4 space-y-2">
        {plan.features.map((feature, index) => (
          <View key={index} className="flex-row items-center">
            <Icon name="check-circle" size={18} color="#4BB543" />
            <Text className="ml-2 text-sm" style={{color: colors.text}}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      {/* Action button */}
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={isLoading}
        onPress={() => onSelect(plan.id)}
        className="py-4 rounded-xl mt-4"
        style={{
          backgroundColor: plan.isBestValue ? colors.primary : 'transparent',
          borderWidth: plan.isBestValue ? 0 : 2,
          borderColor: colors.primary,
        }}>
        {isLoading ? (
          <ActivityIndicator
            color={plan.isBestValue ? 'white' : colors.primary}
          />
        ) : (
          <Text
            className="text-center font-medium"
            style={{
              color: plan.isBestValue ? 'white' : colors.primary,
            }}>
            Choose {plan.name}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default function SubscriptionModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const {isDark} = useThemeStore();
  const {user} = useAuthStore();
  const toast = useToast();
  const colors = isDark ? theme.dark : theme.light;

  const [purchasingPlan, setPurchasingPlan] = useState<string | null>(null);

  const handlePurchase = async (planId: string) => {
    if (!user) {
      toast.error('Please sign in to purchase a subscription');
      return;
    }

    try {
      setPurchasingPlan(planId);
      // Integrate your payment provider (Stripe, RevenueCat, etc.)
      // For now we'll simulate a purchase with a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Success flow
      toast.success('Thank you for your purchase!');

      // Update the user's subscription status in your backend
      // and in the local user store

      onClose();
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Purchase failed. Please try again.');
    } finally {
      setPurchasingPlan(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView
        style={{flex: 1, justifyContent: 'center'}}
        blurType={isDark ? 'dark' : 'light'}
        blurAmount={16}
        reducedTransparencyFallbackColor="white">
        <Animated.View
          style={{backgroundColor: colors.background}}
          className="mx-4 rounded-3xl overflow-hidden"
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}>
          {/* Header Section */}
          <View style={{backgroundColor: colors.primary}} className="p-6">
            <FastImage
              source={require('@src/assets/favicon.png')}
              className="w-full h-32 mb-4"
              resizeMode="contain"
            />
            <Text className="text-2xl font-bold text-white text-center">
              Unlock Premium Features
            </Text>
            <Text className="text-white text-center mt-2 opacity-80">
              Get unlimited access to all features
            </Text>
          </View>

          <ScrollView className="max-h-[70vh] p-6">
            {/* Pricing Cards */}
            <View className="space-y-4">
              {subscriptionPlans.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onSelect={handlePurchase}
                  isLoading={purchasingPlan === plan.id}
                />
              ))}
            </View>

            {/* Features List */}
            <View className="mt-6">
              <Text
                className="text-lg font-semibold mb-3"
                style={{color: colors.text}}>
                Premium Features Include:
              </Text>
              <View className="space-y-2">
                <FeatureItem icon="image" title="HD Resolution Exports" />
                <FeatureItem icon="palette" title="Exclusive Art Styles" />
                <FeatureItem icon="bolt" title="Priority Generation" />
                <FeatureItem
                  icon="workspace-premium"
                  title="Pro Badge Profile"
                />
                <FeatureItem icon="ad-units" title="Ad-Free Experience" />
              </View>
            </View>

            {/* Footer */}
            <Text
              className="text-xs text-center mt-6"
              style={{color: colors.secondaryText}}>
              7-day free trial available • Cancel anytime • Privacy Policy
            </Text>
            <Text
              className="text-xs text-center mt-2"
              style={{color: colors.secondaryText}}>
              © {new Date().getFullYear()} {appConfig.name}
            </Text>
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity
            className="absolute top-4 right-4 p-2 rounded-full"
            style={{backgroundColor: 'rgba(255, 255, 255, 0.3)'}}
            onPress={onClose}
            activeOpacity={0.8}>
            <Icon name="close" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}
