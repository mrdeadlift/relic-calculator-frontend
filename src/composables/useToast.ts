/**
 * Toast Notification Composable
 * トースト通知機能を提供するcomposable
 */

import { ref, readonly } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration: number
  persistent: boolean
  action?: {
    label: string
    handler: () => void
  }
}

// グローバル状態
const toasts = ref<Toast[]>([])
let toastIdCounter = 0

export function useToast() {
  /**
   * トーストを表示
   */
  const showToast = (
    message: string,
    type: ToastType = 'info',
    options: {
      duration?: number
      persistent?: boolean
      action?: {
        label: string
        handler: () => void
      }
    } = {}
  ) => {
    const toast: Toast = {
      id: `toast-${++toastIdCounter}`,
      message,
      type,
      duration: options.duration ?? (type === 'error' ? 6000 : 4000),
      persistent: options.persistent ?? false,
      action: options.action,
    }

    toasts.value.push(toast)

    // 自動削除（永続的でない場合）
    if (!toast.persistent) {
      setTimeout(() => {
        removeToast(toast.id)
      }, toast.duration)
    }

    return toast.id
  }

  /**
   * 成功トーストを表示
   */
  const showSuccess = (
    message: string,
    options?: Omit<Parameters<typeof showToast>[2], 'type'>
  ) => {
    return showToast(message, 'success', options)
  }

  /**
   * エラートーストを表示
   */
  const showError = (
    message: string,
    options?: Omit<Parameters<typeof showToast>[2], 'type'>
  ) => {
    return showToast(message, 'error', options)
  }

  /**
   * 警告トーストを表示
   */
  const showWarning = (
    message: string,
    options?: Omit<Parameters<typeof showToast>[2], 'type'>
  ) => {
    return showToast(message, 'warning', options)
  }

  /**
   * 情報トーストを表示
   */
  const showInfo = (
    message: string,
    options?: Omit<Parameters<typeof showToast>[2], 'type'>
  ) => {
    return showToast(message, 'info', options)
  }

  /**
   * 特定のトーストを削除
   */
  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  /**
   * 全てのトーストを削除
   */
  const clearToasts = () => {
    toasts.value.splice(0)
  }

  /**
   * 特定タイプのトーストを削除
   */
  const clearToastsByType = (type: ToastType) => {
    toasts.value = toasts.value.filter(toast => toast.type !== type)
  }

  /**
   * ローディング状態付きトースト
   */
  const showLoadingToast = (message: string) => {
    return showToast(message, 'info', { persistent: true })
  }

  /**
   * ローディングトーストを更新
   */
  const updateLoadingToast = (
    id: string,
    message: string,
    type: ToastType = 'success'
  ) => {
    const toast = toasts.value.find(t => t.id === id)
    if (toast) {
      toast.message = message
      toast.type = type
      toast.persistent = false

      // 自動削除タイマーを設定
      setTimeout(
        () => {
          removeToast(id)
        },
        type === 'error' ? 6000 : 4000
      )
    }
  }

  /**
   * 確認ダイアログ付きトースト
   */
  const showConfirmToast = (
    message: string,
    confirmLabel: string = '確認',
    cancelLabel: string = 'キャンセル'
  ): Promise<boolean> => {
    return new Promise(resolve => {
      const toastId = showToast(message, 'warning', {
        persistent: true,
        action: {
          label: confirmLabel,
          handler: () => {
            removeToast(toastId)
            resolve(true)
          },
        },
      })

      // キャンセル用タイマー（30秒後に自動キャンセル）
      setTimeout(() => {
        const existingToast = toasts.value.find(t => t.id === toastId)
        if (existingToast) {
          removeToast(toastId)
          resolve(false)
        }
      }, 30000)
    })
  }

  return {
    // 状態
    toasts: readonly(toasts),

    // メソッド
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearToasts,
    clearToastsByType,
    showLoadingToast,
    updateLoadingToast,
    showConfirmToast,
  }
}

// Toast コンポーネント用のユーティリティ
export const getToastIcon = (type: ToastType): string => {
  const icons = {
    success: 'icon-check-circle',
    error: 'icon-x-circle',
    warning: 'icon-alert-triangle',
    info: 'icon-info-circle',
  }
  return icons[type]
}

export const getToastColor = (type: ToastType): string => {
  const colors = {
    success: '#48bb78',
    error: '#e53e3e',
    warning: '#ed8936',
    info: '#4299e1',
  }
  return colors[type]
}
