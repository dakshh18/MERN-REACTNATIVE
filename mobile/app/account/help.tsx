import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
} from 'react-native'
import React, { useState } from 'react'
import SafeScreen from '@/components/SafeScreen'
import ScreenHeader from '@/components/ScreenHeader'
import { Ionicons } from '@expo/vector-icons'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

interface Faq {
  q: string
  a: string
}

const FAQS: Faq[] = [
  {
    q: 'How long does delivery take?',
    a: 'Standard shipping arrives within 3–7 business days after the order ships. You can track the live status from My Orders.',
  },
  {
    q: 'Can I cancel or change my order?',
    a: 'Orders can be cancelled while they are still in the Pending stage. Once an order is marked as Shipped, it can no longer be cancelled but can be returned after delivery.',
  },
  {
    q: 'How do refunds work?',
    a: 'Refunds for card payments are processed via Stripe back to the original payment method, typically within 5–10 business days. Cash-on-Delivery refunds are issued as store credit.',
  },
  {
    q: 'Is my payment information secure?',
    a: 'Yes. All card payments are tokenized by Stripe and never touch our servers. We are PCI-DSS compliant by design.',
  },
  {
    q: 'How do I change my shipping address?',
    a: 'You can manage all your saved addresses from Profile → Shipping Addresses. The default address is used at checkout unless you pick a different one.',
  },
  {
    q: 'I never received my order — what now?',
    a: "If your order shows Delivered but you haven't received it, please contact us via Help & Support within 48 hours and we'll investigate with the carrier.",
  },
]

const HelpScreen = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  const toggle = (idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setOpenIdx(openIdx === idx ? null : idx)
  }

  return (
    <SafeScreen>
      <ScreenHeader title='Help & Support' subtitle="We're here to help" />

      <ScrollView
        className='flex-1'
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact card */}
        <View className='bg-surface rounded-3xl p-5 mb-5'>
          <Text className='text-text-primary font-bold mb-3'>
            Talk to a human
          </Text>
          <ContactRow
            icon='mail'
            color='#00D9FF'
            title='Email Support'
            subtitle='support@mern-shop.example'
            onPress={() => Linking.openURL('mailto:support@mern-shop.example')}
          />
          <Divider />
          <ContactRow
            icon='chatbubble-ellipses'
            color='#1DB954'
            title='Live Chat'
            subtitle='Mon–Fri, 9am–6pm'
            soon
          />
          <Divider />
          <ContactRow
            icon='call'
            color='#FFC107'
            title='Phone Support'
            subtitle='+1 (555) 123-4567'
            soon
          />
        </View>

        {/* FAQ */}
        <Text className='text-text-primary text-base font-bold mb-2'>
          Frequently Asked Questions
        </Text>
        <View className='bg-surface rounded-3xl overflow-hidden'>
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx
            return (
              <View key={faq.q}>
                <TouchableOpacity
                  onPress={() => toggle(idx)}
                  activeOpacity={0.7}
                  className='flex-row items-center px-4 py-4'
                >
                  <Text className='flex-1 text-text-primary font-semibold text-sm pr-2'>
                    {faq.q}
                  </Text>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color='#666'
                  />
                </TouchableOpacity>
                {isOpen && (
                  <View className='px-4 pb-4'>
                    <Text className='text-text-secondary text-sm leading-5'>
                      {faq.a}
                    </Text>
                  </View>
                )}
                {idx !== FAQS.length - 1 && (
                  <View className='h-px bg-background-lighter mx-4' />
                )}
              </View>
            )
          })}
        </View>

        {/* Resources */}
        <Text className='text-text-primary text-base font-bold mt-5 mb-2'>
          Resources
        </Text>
        <View className='bg-surface rounded-3xl overflow-hidden'>
          <ResourceRow icon='document-text-outline' title='Terms of Service' />
          <View className='h-px bg-background-lighter mx-4' />
          <ResourceRow icon='shield-checkmark-outline' title='Privacy Policy' />
          <View className='h-px bg-background-lighter mx-4' />
          <ResourceRow icon='refresh-outline' title='Returns & Refunds' />
        </View>

        <Text className='text-text-secondary text-xs text-center mt-6'>
          App version 1.0.0
        </Text>
      </ScrollView>
    </SafeScreen>
  )
}

const Divider = () => <View className='h-px bg-background-lighter my-2' />

interface ContactRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name']
  color: string
  title: string
  subtitle: string
  soon?: boolean
  onPress?: () => void
}

const ContactRow: React.FC<ContactRowProps> = ({
  icon,
  color,
  title,
  subtitle,
  soon,
  onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={soon || !onPress}
    activeOpacity={0.7}
    className='flex-row items-center py-2'
  >
    <View
      className='w-10 h-10 rounded-full items-center justify-center'
      style={{ backgroundColor: `${color}22` }}
    >
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <View className='flex-1 ml-3'>
      <Text className='text-text-primary font-semibold text-sm'>{title}</Text>
      <Text className='text-text-secondary text-xs mt-0.5'>{subtitle}</Text>
    </View>
    {soon ? (
      <Text className='text-text-secondary text-xs'>Coming soon</Text>
    ) : (
      <Ionicons name='chevron-forward' size={16} color='#666' />
    )}
  </TouchableOpacity>
)

const ResourceRow: React.FC<{ icon: React.ComponentProps<typeof Ionicons>['name']; title: string }> = ({
  icon,
  title,
}) => (
  <View className='flex-row items-center px-4 py-4'>
    <View className='w-9 h-9 rounded-full bg-background items-center justify-center'>
      <Ionicons name={icon} size={16} color='#fff' />
    </View>
    <Text className='flex-1 ml-3 text-text-primary font-semibold text-sm'>
      {title}
    </Text>
    <Ionicons name='chevron-forward' size={16} color='#666' />
  </View>
)

export default HelpScreen
