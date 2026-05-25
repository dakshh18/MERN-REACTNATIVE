import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import React, { useEffect, useMemo, useState } from 'react'
import SafeScreen from '@/components/SafeScreen'
import CheckoutStepper from '@/components/CheckoutStepper'
import useAddresses, { AddressInput } from '@/hooks/useAddresses'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import { Address } from '@/types'

const emptyForm: AddressInput = {
  label: 'Home',
  fullName: '',
  streetAddress: '',
  city: '',
  state: '',
  zipCode: '',
  phoneNumber: '',
  isDefault: false,
}

const AddressScreen = () => {
  const { addresses, isLoading, addAddress, isAddingAddress } = useAddresses()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<AddressInput>(emptyForm)

  useEffect(() => {
    if (!selectedId && addresses.length > 0) {
      const def = addresses.find((a) => a.isDefault) ?? addresses[0]
      setSelectedId(def._id)
    }
  }, [addresses, selectedId])

  const selected = useMemo(
    () => addresses.find((a) => a._id === selectedId),
    [addresses, selectedId]
  )

  const handleAdd = () => {
    if (
      !form.fullName ||
      !form.streetAddress ||
      !form.city ||
      !form.state ||
      !form.zipCode ||
      !form.phoneNumber
    ) {
      Toast.show({
        type: 'error',
        text1: 'All fields are required',
        position: 'top',
      })
      return
    }
    if (form.phoneNumber.length !== 10) {
      Toast.show({ type: 'error', text1: 'Phone must be 10 digits', position: 'top' })
      return
    }
    if (form.zipCode.length !== 6) {
      Toast.show({ type: 'error', text1: 'Zip must be 6 digits', position: 'top' })
      return
    }
    addAddress(form, {
      onSuccess: () => {
        setForm(emptyForm)
        setShowForm(false)
        Toast.show({
          type: 'success',
          text1: 'Address added',
          position: 'top',
          visibilityTime: 1600,
        })
      },
      onError: (err: any) => {
        Toast.show({
          type: 'error',
          text1: 'Could not add address',
          text2: err?.response?.data?.message ?? 'Try again',
          position: 'top',
        })
      },
    })
  }

  const goToReview = () => {
    if (!selected) {
      Toast.show({
        type: 'error',
        text1: 'Please select an address',
        position: 'top',
      })
      return
    }
    router.push({
      pathname: '/checkout/review',
      params: { addressId: selected._id },
    })
  }

  return (
    <SafeScreen>
      <CheckoutStepper title='Shipping Address' step={1} />

      {isLoading ? (
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color='#00D9FF' />
        </View>
      ) : (
        <>
          <ScrollView
            className='flex-1'
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
          >
            {addresses.length === 0 ? (
              <View className='bg-surface rounded-3xl p-8 items-center mt-4'>
                <Ionicons name='location-outline' size={40} color='#666' />
                <Text className='text-text-primary font-semibold mt-3'>
                  No saved addresses
                </Text>
                <Text className='text-text-secondary text-sm mt-1 text-center'>
                  Add a shipping address to continue.
                </Text>
              </View>
            ) : (
              addresses.map((addr: Address) => {
                const isSelected = selectedId === addr._id
                return (
                  <TouchableOpacity
                    key={addr._id}
                    onPress={() => setSelectedId(addr._id)}
                    activeOpacity={0.8}
                    className={`bg-surface rounded-3xl p-4 mb-3 flex-row ${
                      isSelected ? 'border-2 border-primary' : ''
                    }`}
                  >
                    <View
                      className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 mt-1 ${
                        isSelected ? 'border-primary' : 'border-text-secondary'
                      }`}
                    >
                      {isSelected && (
                        <View className='w-3 h-3 rounded-full bg-primary' />
                      )}
                    </View>
                    <View className='flex-1'>
                      <View className='flex-row items-center mb-1'>
                        <Text className='text-text-primary font-bold'>
                          {addr.label}
                        </Text>
                        {addr.isDefault && (
                          <View className='bg-primary/20 px-2 py-0.5 rounded-full ml-2'>
                            <Text className='text-primary text-xs font-semibold'>
                              Default
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className='text-text-primary text-sm'>
                        {addr.fullName}
                      </Text>
                      <Text className='text-text-secondary text-sm mt-0.5'>
                        {addr.streetAddress}, {addr.city}, {addr.state} {addr.zipCode}
                      </Text>
                      <Text className='text-text-secondary text-sm'>
                        {addr.phoneNumber}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )
              })
            )}

            <TouchableOpacity
              onPress={() => setShowForm(true)}
              activeOpacity={0.8}
              className='bg-surface border border-dashed border-text-secondary/40 rounded-3xl py-5 items-center justify-center mt-2 flex-row'
            >
              <Ionicons name='add' size={20} color='#00D9FF' />
              <Text className='text-primary font-semibold ml-2'>
                Add new address
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Continue bar */}
          <View
            className='absolute left-0 right-0 px-6 pb-8 pt-3 bg-background'
            style={{ bottom: 0 }}
          >
            <TouchableOpacity
              onPress={goToReview}
              disabled={!selected}
              activeOpacity={0.85}
              className={`rounded-full py-4 items-center ${
                selected ? 'bg-primary' : 'bg-surface'
              }`}
            >
              <Text
                className={`font-bold text-base ${
                  selected ? 'text-background' : 'text-text-secondary'
                }`}
              >
                Continue to Review
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Add address form modal */}
      <Modal
        visible={showForm}
        animationType='slide'
        transparent
        // statusBarTranslucent lets the Modal share the main window's
        // adjustResize behavior on Android (otherwise the Modal is its
        // own window and ignores keyboard layout).
        statusBarTranslucent
        onRequestClose={() => setShowForm(false)}
      >
        <View className='flex-1 justify-end bg-black/60'>
          <View className='bg-background rounded-t-3xl px-6 pt-5 pb-8 max-h-[88%]'>
            <View className='flex-row items-center justify-between mb-4'>
              <Text className='text-text-primary text-xl font-bold'>
                New Address
              </Text>
              <TouchableOpacity
                onPress={() => setShowForm(false)}
                className='bg-surface w-9 h-9 rounded-full items-center justify-center'
              >
                <Ionicons name='close' size={18} color='#fff' />
              </TouchableOpacity>
            </View>

            {/* KeyboardAwareScrollView auto-scrolls the focused TextInput above
                the keyboard. Works inside Modals on Android where stock
                KeyboardAvoidingView is unreliable with edge-to-edge layouts. */}
            <KeyboardAwareScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps='handled'
              enableOnAndroid
              extraScrollHeight={24}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              <Field
                label='Label'
                value={form.label}
                placeholder='Home, Office...'
                onChangeText={(v) => setForm((f) => ({ ...f, label: v }))}
              />
              <Field
                label='Full Name'
                value={form.fullName}
                onChangeText={(v) => setForm((f) => ({ ...f, fullName: v }))}
              />
              <Field
                label='Street Address'
                value={form.streetAddress}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, streetAddress: v }))
                }
              />
              <View className='flex-row gap-3'>
                <View className='flex-1'>
                  <Field
                    label='City'
                    value={form.city}
                    onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
                  />
                </View>
                <View className='flex-1'>
                  <Field
                    label='State'
                    value={form.state}
                    onChangeText={(v) => setForm((f) => ({ ...f, state: v }))}
                  />
                </View>
              </View>
              <View className='flex-row gap-3'>
                <View className='flex-1'>
                  <Field
                    label='Zip Code'
                    value={form.zipCode}
                    keyboardType='number-pad'
                    maxLength={6}
                    onChangeText={(v) =>
                      setForm((f) => ({ ...f, zipCode: v.replace(/\D/g, '') }))
                    }
                  />
                </View>
                <View className='flex-1'>
                  <Field
                    label='Phone'
                    value={form.phoneNumber}
                    keyboardType='phone-pad'
                    maxLength={10}
                    onChangeText={(v) =>
                      setForm((f) => ({ ...f, phoneNumber: v.replace(/\D/g, '') }))
                    }
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={() =>
                  setForm((f) => ({ ...f, isDefault: !f.isDefault }))
                }
                className='flex-row items-center mt-2 mb-4'
                activeOpacity={0.7}
              >
                <View
                  className={`w-5 h-5 rounded border-2 items-center justify-center mr-2 ${
                    form.isDefault
                      ? 'bg-primary border-primary'
                      : 'border-text-secondary'
                  }`}
                >
                  {form.isDefault && (
                    <Ionicons name='checkmark' size={14} color='#121212' />
                  )}
                </View>
                <Text className='text-text-primary text-sm'>
                  Set as default address
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAdd}
                disabled={isAddingAddress}
                activeOpacity={0.85}
                className='bg-primary rounded-full py-4 items-center mt-2'
              >
                {isAddingAddress ? (
                  <ActivityIndicator color='#121212' />
                ) : (
                  <Text className='text-background font-bold'>Save Address</Text>
                )}
              </TouchableOpacity>
            </KeyboardAwareScrollView>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  )
}

interface FieldProps {
  label: string
  value: string
  placeholder?: string
  keyboardType?: 'default' | 'number-pad' | 'phone-pad'
  maxLength?: number
  onChangeText: (v: string) => void
}

const Field: React.FC<FieldProps> = ({
  label,
  value,
  placeholder,
  keyboardType = 'default',
  maxLength,
  onChangeText,
}) => (
  <View className='mb-3'>
    <Text className='text-text-secondary text-xs mb-1.5 ml-1'>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor='#666'
      keyboardType={keyboardType}
      maxLength={maxLength}
      className='bg-surface text-text-primary rounded-2xl px-4 py-3'
    />
  </View>
)

export default AddressScreen
