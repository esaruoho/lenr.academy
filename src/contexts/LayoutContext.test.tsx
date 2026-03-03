import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { LayoutProvider, useLayout } from './LayoutContext'

describe('LayoutContext', () => {
  it('sidebar starts closed', () => {
    const { result } = renderHook(() => useLayout(), {
      wrapper: LayoutProvider,
    })

    expect(result.current.sidebarOpen).toBe(false)
  })

  it('openSidebar opens the sidebar', () => {
    const { result } = renderHook(() => useLayout(), {
      wrapper: LayoutProvider,
    })

    act(() => { result.current.openSidebar() })

    expect(result.current.sidebarOpen).toBe(true)
  })

  it('closeSidebar closes the sidebar', () => {
    const { result } = renderHook(() => useLayout(), {
      wrapper: LayoutProvider,
    })

    act(() => { result.current.openSidebar() })
    act(() => { result.current.closeSidebar() })

    expect(result.current.sidebarOpen).toBe(false)
  })

  it('setSidebarOpen sets the sidebar state directly', () => {
    const { result } = renderHook(() => useLayout(), {
      wrapper: LayoutProvider,
    })

    act(() => { result.current.setSidebarOpen(true) })
    expect(result.current.sidebarOpen).toBe(true)

    act(() => { result.current.setSidebarOpen(false) })
    expect(result.current.sidebarOpen).toBe(false)
  })

  it('mobileHeaderHidden starts as false', () => {
    const { result } = renderHook(() => useLayout(), {
      wrapper: LayoutProvider,
    })

    expect(result.current.mobileHeaderHidden).toBe(false)
  })

  it('setMobileHeaderHidden updates state', () => {
    const { result } = renderHook(() => useLayout(), {
      wrapper: LayoutProvider,
    })

    act(() => { result.current.setMobileHeaderHidden(true) })
    expect(result.current.mobileHeaderHidden).toBe(true)

    act(() => { result.current.setMobileHeaderHidden(false) })
    expect(result.current.mobileHeaderHidden).toBe(false)
  })

  it('throws when used outside LayoutProvider', () => {
    expect(() => {
      renderHook(() => useLayout())
    }).toThrow('useLayout must be used within a LayoutProvider')
  })
})
