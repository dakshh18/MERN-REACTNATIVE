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

import React, { useState } from 'react'
import SafeScreen from '@/components/SafeScreen'
import ScreenHeader from '@/components/ScreenHeader'
import ConfirmModal from '@/components/ConfirmModal'
import useAddresses, { AddressInput } from '@/hooks/useAddresses'
import { Ionicons } from '@expo/vector-icons'
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

const AddressesScreen = () => {
  const {
    addresses,
    isLoading,
    addAddress,
    isAddingAddress,
    updateAddress,
    isUpdatingAddress,
    deleteAddress,
    isDeletingAddress,
  } = useAddresses()

  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [form, setForm] = useState<AddressInput>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null)

  const openAddForm = () => {
    setEditingAddress(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEditForm = (addr: Address) => {
    setEditingAddress(addr)
    setForm({
      label: addr.label,
      fullName: addr.fullName,
      streetAddress: addr.streetAddress,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      phoneNumber: addr.phoneNumber,
      isDefault: addr.isDefault,
    })
    setShowForm(true)
  }

  const validate = (): string | null => {
    if (
      !form.fullName ||
      !form.streetAddress ||
      !form.city ||
      !form.state ||
      !form.zipCode ||
      !form.phoneNumber
    ) {
      return 'All fields are required'
    }
    if (form.phoneNumber.length !== 10) return 'Phone must be 10 digits'
    if (form.zipCode.length !== 6) return 'Zip must be 6 digits'
    return null
  }

  const handleSave = () => {
    const err = validate()
    if (err) {
      Toast.show({ type: 'error', text1: err, position: 'top' })
      return
    }

    const onSuccess = (text: string) => {
      setShowForm(false)
      setEditingAddress(null)
      setForm(emptyForm)
      Toast.show({
        type: 'success',
        text1: text,
        position: 'top',
        visibilityTime: 1600,
      })
    }

    const onError = (e: any) => {
      Toast.show({
        type: 'error',
        text1: 'Could not save address',
        text2: e?.response?.data?.message ?? 'Try again',
        position: 'top',
      })
    }

    if (editingAddress) {
      updateAddress(
        { id: editingAddress._id, input: form },
        {
          onSuccess: () => onSuccess('Address updated'),
          onError,
        }
      )
    } else {
      addAddress(form, {
        onSuccess: () => onSuccess('Address added'),
        onError,
      })
    }
  }

  const handleSetDefault = (addr: Address) => {
    if (addr.isDefault) return
    updateAddress(
      { id: addr._id, input: { isDefault: true } },
      {
        onSuccess: () =>
          Toast.show({
            type: 'success',
            text1: 'Default address updated',
            position: 'top',
            visibilityTime: 1500,
          }),
        onError: () =>
          Toast.show({
            type: 'error',
            text1: 'Could not update default',
            position: 'top',
          }),
      }
    )
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    const target = deleteTarget
    deleteAddress(target._id, {
      onSuccess: () => {
        setDeleteTarget(null)
        Toast.show({
          type: 'success',
          text1: 'Address deleted',
          position: 'top',
          visibilityTime: 1500,
        })
      },
      onError: () => {
        setDeleteTarget(null)
        Toast.show({
          type: 'error',
          text1: 'Could not delete address',
          position: 'top',
        })
      },
    })
  }

  return (
    <SafeScreen>
      <ScreenHeader
        title='Shipping Addresses'
        subtitle={`${addresses.length} saved`}
        rightAction={{ icon: 'add', onPress: openAddForm, color: '#00D9FF' }}
      />

      {isLoading ? (
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color='#00D9FF' />
        </View>
      ) : addresses.length === 0 ? (
        <View className='flex-1 items-center justify-center px-6'>
          <Ionicons name='location-outline' size={56} color='#666' />
          <Text className='text-text-primary font-semibold mt-4 text-lg'>
            No addresses yet
          </Text>
          <Text className='text-text-secondary text-sm mt-2 text-center'>
            Add an address so you can check out faster.
          </Text>
          <TouchableOpacity
            onPress={openAddForm}
            className='bg-primary rounded-full px-6 py-3 mt-6'
            activeOpacity={0.85}
          >
            <Text className='text-background font-bold'>Add Address</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className='flex-1'
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {addresses.map((addr) => (
            <View key={addr._id} className='bg-surface rounded-3xl p-4 mb-3'>
              <View className='flex-row items-center justify-between mb-2'>
                <View className='flex-row items-center'>
                  <Ionicons name='location' size={16} color='#1DB954' />
                  <Text className='text-text-primary font-bold ml-2'>
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
                <View className='flex-row gap-2'>
                  <TouchableOpacity
                    onPress={() => openEditForm(addr)}
                    className='bg-background w-9 h-9 rounded-full items-center justify-center'
                    activeOpacity={0.7}
                  >
                    <Ionicons name='pencil' size={14} color='#fff' />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setDeleteTarget(addr)}
                    className='bg-background w-9 h-9 rounded-full items-center justify-center'
                    activeOpacity={0.7}
                  >
                    <Ionicons name='trash-outline' size={14} color='#FF6B6B' />
                  </TouchableOpacity>
                </View>
              </View>

              <Text className='text-text-primary text-sm'>{addr.fullName}</Text>
              <Text className='text-text-secondary text-sm mt-0.5'>
                {addr.streetAddress}, {addr.city}, {addr.state} {addr.zipCode}
              </Text>
              <Text className='text-text-secondary text-sm'>
                {addr.phoneNumber}
              </Text>

              {!addr.isDefault && (
                <TouchableOpacity
                  onPress={() => handleSetDefault(addr)}
                  className='mt-3 self-start'
                  activeOpacity={0.7}
                  disabled={isUpdatingAddress}
                >
                  <Text className='text-primary text-xs font-semibold'>
                    Set as default
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Add/edit form modal */}
      <Modal
        visible={showForm}
        animationType='slide'
        transparent
        // statusBarTranslucent is the magic prop here: without it, Android puts
        // the Modal in its own fullscreen window that ignores the app's
        // windowSoftInputMode=adjustResize. Result: keyboard covers inputs.
        // With it, the Modal overlays the main window and inherits its resize
        // behavior, so the form rides above the keyboard.
        statusBarTranslucent
        onRequestClose={() => setShowForm(false)}
      >
        <View className='flex-1 justify-end bg-black/60'>
          <View className='bg-background rounded-t-3xl px-6 pt-5 pb-8 max-h-[88%]'>
            <View className='flex-row items-center justify-between mb-4'>
              <Text className='text-text-primary text-xl font-bold'>
                {editingAddress ? 'Edit Address' : 'New Address'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowForm(false)}
                className='bg-surface w-9 h-9 rounded-full items-center justify-center'
              >
                <Ionicons name='close' size={18} color='#fff' />
              </TouchableOpacity>
            </View>

            {/* KeyboardAwareScrollView measures the focused TextInput and scrolls
                it above the keyboard automatically. Works inside Modals on
                Android where stock KeyboardAvoidingView is unreliable. */}
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
                      setForm((f) => ({
                        ...f,
                        phoneNumber: v.replace(/\D/g, ''),
                      }))
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
                onPress={handleSave}
                disabled={isAddingAddress || isUpdatingAddress}
                activeOpacity={0.85}
                className='bg-primary rounded-full py-4 items-center mt-2'
              >
                {isAddingAddress || isUpdatingAddress ? (
                  <ActivityIndicator color='#121212' />
                ) : (
                  <Text className='text-background font-bold'>
                    {editingAddress ? 'Save Changes' : 'Save Address'}
                  </Text>
                )}
              </TouchableOpacity>
            </KeyboardAwareScrollView>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={!!deleteTarget}
        title='Delete this address?'
        message={
          deleteTarget
            ? `${deleteTarget.label} (${deleteTarget.city}) will be permanently removed.`
            : undefined
        }
        confirmLabel='Delete'
        variant='danger'
        isLoading={isDeletingAddress}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
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

export default AddressesScreen
