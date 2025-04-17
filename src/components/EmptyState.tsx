import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';

interface EmptyStateProps {
    colors: {
        text: string;
        primary: string;
        secondaryText: string;
        surface: string;
        background?: string;
    };
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

const EmptyState: React.FC<EmptyStateProps> = ({ colors }) => {
    return (
        <View className="items-center justify-center py-16 flex-1">
            {/* Premium Icon Display with subtle effects */}
            <View className="relative items-center mb-12">
                <View
                    className="w-36 h-36 rounded-full items-center justify-center"
                    style={{
                        backgroundColor: colors.surface,
                        shadowColor: colors.primary,
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.15,
                        shadowRadius: 20,
                        elevation: 8,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor: colors.primary + '30',
                    }}
                >
                    {/* Integrated Creative Lightbulb Icon */}
                    <Svg width={70} height={70} viewBox="0 0 24 24">
                        <Defs>
                            <LinearGradient id="lightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.2" />
                                <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.1" />
                            </LinearGradient>
                        </Defs>

                        {/* Light bulb circle background */}
                        <Circle cx="12" cy="12" r="9" fill="url(#lightGradient)" />

                        {/* Main illustration */}
                        <G>
                            {/* Light rays */}
                            <Path
                                d="M12 3V5M12 19V21M21 12H19M5 12H3M18.36 5.64L16.95 7.05M7.05 16.95L5.64 18.36M18.36 18.36L16.95 16.95M7.05 7.05L5.64 5.64"
                                stroke={colors.primary + '80'}
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Lightbulb */}
                            <Path
                                d="M9.5 16.5h5c0-1.5 1.5-2 1.5-5C16 8.36 14.14 6 12 6s-4 2.36-4 5.5c0 3 1.5 3.5 1.5 5Z"
                                fill="none"
                                stroke={colors.primary}
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Bulb base */}
                            <Path
                                d="M9.5 16.5v1c0 .8.7 1.5 1.5 1.5h2c.8 0 1.5-.7 1.5-1.5v-1"
                                fill="none"
                                stroke={colors.primary}
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Spark inside bulb */}
                            <Path
                                d="M12 9l.5 2h-1L12 13.5"
                                stroke={colors.primary}
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </G>
                    </Svg>
                </View>

                {/* Elegant accent circles */}
                <View
                    className="absolute w-10 h-10 rounded-full opacity-10"
                    style={{
                        backgroundColor: colors.primary,
                        top: -10,
                        right: 5,
                    }}
                />
                <View
                    className="absolute w-6 h-6 rounded-full opacity-10"
                    style={{ backgroundColor: colors.primary, bottom: 0, left: 0, }}
                />
                <View
                    className="absolute w-4 h-4 rounded-full opacity-20"
                    style={{ backgroundColor: colors.primary, top: 15, left: 20, }}
                />
            </View>

            {/* Premium Typography */}
            <Text
                className="text-3xl font-semibold tracking-tight text-center px-8 mb-3"
                style={{ color: colors.text }}
            >
                Unleash Your Creativity
            </Text>

            <Text
                className="text-center mx-10 mb-8 text-base leading-6"
                style={{ color: colors.secondaryText }}
            >
                Create stunning AI-generated art with a simple description
            </Text>

            {/* Premium Card */}
            <View
                className="w-full px-6"
                style={{ maxWidth: CARD_WIDTH }}
            >
                <View
                    className="overflow-hidden rounded-2xl"
                    style={{
                        backgroundColor: colors.surface,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                        elevation: 5,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor: colors.primary + '20',
                    }}
                >
                    {/* Card header accent bar */}
                    <View
                        className="h-1.5 w-full mb-1"
                        style={{ backgroundColor: colors.primary + '50' }}
                    />

                    <View className="p-6">
                        {/* Card content */}
                        <View className="flex-row items-center mb-4">
                            <View
                                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                                style={{ backgroundColor: colors.primary + '15' }}
                            >
                                {/* Mini lightbulb icon for the tip section */}
                                <Svg width={18} height={18} viewBox="0 0 24 24">
                                    <Path
                                        d="M9 21h6m-3-8v4m3-9.5c0 2.5-1 3-1 4.5h-4c0-1.5-1-2-1-4.5C9 10 10 6 12 6s3 4 3 7.5z"
                                        stroke={colors.primary}
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        fill="none"
                                    />
                                </Svg>
                            </View>
                            <Text
                                className="text-base font-medium"
                                style={{ color: colors.text }}
                            >
                                Pro Tips
                            </Text>
                        </View>

                        <Text
                            className="leading-6"
                            style={{ color: colors.secondaryText }}
                        >
                            Enhance your results by including terms like
                            <Text style={{ color: colors.primary }}> "cinematic lighting"</Text>,
                            <Text style={{ color: colors.primary }}> "detailed"</Text>, or
                            <Text style={{ color: colors.primary }}> "8k resolution"</Text>.
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default EmptyState;
