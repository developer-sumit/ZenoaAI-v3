import React from 'react';
import {BaseToast, ErrorToast} from 'react-native-toast-message';

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        marginTop: 20,
        borderLeftColor: '#10b981',
        borderRightColor: '#10b981',
        borderLeftWidth: 15,
        borderRightWidth: 15,
        height: 'auto',
        paddingVertical: 15,
        borderRadius: 16,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#111827', // #065f46
        numberOfLines: 0, // Allow unlimited lines
      }}
      text1NumberOfLines={0}
    />
  ),

  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        marginTop: 20,
        borderLeftColor: '#ef4444',
        borderRightColor: '#ef4444',
        borderLeftWidth: 15,
        borderRightWidth: 15,
        height: 'auto',
        paddingVertical: 15,
        borderRadius: 16,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#111827', // #991b1b
        numberOfLines: 0,
      }}
      text1NumberOfLines={0}
    />
  ),

  info: (props: any) => (
    <BaseToast
      {...props}
      style={{
        marginTop: 20,
        borderLeftColor: '#3b82f6',
        borderRightColor: '#3b82f6',
        borderLeftWidth: 15,
        borderRightWidth: 15,
        height: 'auto',
        paddingVertical: 15,
        borderRadius: 16,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#111827', // #1e40af
        numberOfLines: 0,
      }}
      text1NumberOfLines={0}
    />
  ),

  warning: (props: any) => (
    <BaseToast
      {...props}
      style={{
        marginTop: 20,
        borderLeftColor: '#f59e0b',
        borderRightColor: '#f59e0b',
        borderLeftWidth: 15,
        borderRightWidth: 15,
        height: 'auto',
        paddingVertical: 15,
        borderRadius: 16,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#111827', // #92400e
        numberOfLines: 0,
      }}
      text1NumberOfLines={0}
    />
  ),

  any: (props: any) => (
    <BaseToast
      {...props}
      style={{
        marginTop: 20,
        borderLeftColor: '#6b7280',
        borderRightColor: '#6b7280',
        borderLeftWidth: 15,
        borderRightWidth: 15,
        height: 'auto',
        paddingVertical: 15,
        borderRadius: 16,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#111827', // #374151
        numberOfLines: 0,
      }}
      text1NumberOfLines={0}
    />
  ),
};
