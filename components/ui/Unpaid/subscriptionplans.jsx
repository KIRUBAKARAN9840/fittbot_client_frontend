
import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Modal,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const subscriptionPlans = [
    {
        id: '1',
        name: 'Basic',
        price: '₹999',
        duration: '1 Month',
        features: ['Access to all gym equipment', 'Basic workout plans', '1 consultation/month'],
        popular: false,
        discount: '10% off'
    },
    {
        id: '2',
        name: 'Premium',
        price: '₹2499',
        duration: '3 Months',
        features: ['All Basic features', 'Personalized workout plans', 'Weekly consultations', 'Nutrition guidance'],
        popular: true,
        discount: '15% off'
    },
    {
        id: '3',
        name: 'Pro',
        price: '₹4999',
        duration: '6 Months',
        features: ['All Premium features', 'Priority booking', 'Daily consultations', 'Supplement vouchers'],
        popular: false,
        discount: '20% off'
    },
    {
        id: '4',
        name: 'Elite',
        price: '₹8999',
        duration: '12 Months',
        features: ['All Pro features', 'Personal trainer', '24/7 support', 'Exclusive events'],
        popular: false,
        discount: '25% off'
    },
    {
        id: '5',
        name: 'Family',
        price: '₹14999',
        duration: '12 Months',
        features: ['All Elite features', 'Up to 4 family members', 'Group sessions', 'Special discounts'],
        popular: false,
        discount: '30% off'
    }
];

const SubscriptionPlansComponent = ({ visible, onClose, selectedGym }) => {
    const PlanItem = ({ item }) => {
        return (
            <Animatable.View
                animation="fadeInUp"
                style={[
                    styles.planCard,
                    item.popular && styles.popularPlanCard
                ]}
                useNativeDriver
            >
                {item.popular && (
                    <View style={styles.popularBadge}>
                        <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                    </View>
                )}
                <Text style={styles.planName}>{item.name}</Text>
                <View style={styles.pricingContainer}>
                    <Text style={styles.planPrice}>{item.price}</Text>
                    <Text style={styles.planDuration}>/ {item.duration}</Text>
                </View>

                <View style={styles.discountContainer}>
                    <Text style={styles.discountText}>{item.discount}</Text>
                </View>

                <View style={styles.planFeatures}>
                    {item.features.map((feature, index) => (
                        <View key={index} style={styles.planFeatureItem}>
                            <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                            <Text style={styles.planFeatureText}>{feature}</Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={[
                    styles.subscribeButton,
                    item.popular ? styles.popularSubscribeButton : {}
                ]}>
                    <Text style={[
                        styles.subscribeButtonText,
                        item.popular ? styles.popularSubscribeButtonText : {}
                    ]}>SUBSCRIBE NOW</Text>
                </TouchableOpacity>
            </Animatable.View>
        );
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable style={styles.plansModalContent}>
                    <View style={styles.plansModalHeader}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.plansModalTitle}>
                            {selectedGym ? `${selectedGym.name} Plans` : "Subscription Plans"}
                        </Text>
                    </View>

                    <FlatList
                        data={subscriptionPlans}
                        renderItem={({ item }) => <PlanItem item={item} />}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.plansList}
                        showsVerticalScrollIndicator={false}
                    />
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    plansModalContent: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    plansModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF5757',
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    closeButton: {
        padding: 8,
    },
    plansModalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 10,
    },
    plansList: {
        padding: 20,
    },
    planCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        position: 'relative',
    },
    popularPlanCard: {
        borderWidth: 2,
        borderColor: '#FF5757',
    },
    popularBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#FF5757',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    popularBadgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 10,
    },
    planName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    pricingContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 5,
    },
    planPrice: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FF5757',
    },
    planDuration: {
        fontSize: 14,
        color: '#666',
        marginLeft: 5,
    },
    discountContainer: {
        backgroundColor: '#E3F2FD',
        borderRadius: 15,
        paddingHorizontal: 10,
        paddingVertical: 5,
        alignSelf: 'flex-start',
        marginBottom: 15,
    },
    discountText: {
        color: '#2196F3',
        fontWeight: 'bold',
        fontSize: 12,
    },
    planFeatures: {
        marginBottom: 20,
    },
    planFeatureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    planFeatureText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    subscribeButton: {
        backgroundColor: '#f0f0f0',
        borderRadius: 25,
        paddingVertical: 12,
        alignItems: 'center',
    },
    subscribeButtonText: {
        color: '#333',
        fontWeight: 'bold',
        fontSize: 14,
    },
    popularSubscribeButton: {
        backgroundColor: '#FF5757',
    },
    popularSubscribeButtonText: {
        color: '#fff',
    },
});

export default SubscriptionPlansComponent;