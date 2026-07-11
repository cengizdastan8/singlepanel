# TekPanel Product Requirements Document (PRD)

## Overview
TekPanel is a notification-first Android inbox built with Next.js and Capacitor. It captures notifications from various channels (WhatsApp, Instagram, Facebook, TikTok, X, SMS) via a native Android bridge and displays them in a dense, mobile-first web view.

## Core Features
1. **Message Capture & Display**: Fetch incoming notifications through the `NativeInbox` bridge and display them chronologically.
2. **Channel Management**: A bottom sheet/panel allowing users to enable or disable capture for specific source apps.
3. **Clear Screen**: Ability to wipe all currently captured messages from local state.
4. **Offline Resilience**: Local storage of messages and channels so the app functions instantly upon reopening.
5. **Mobile-First Vibe UI**: A premium, anti-slop, dense list view with strict 390px layout constraints, utilizing accent colors per platform to distinguish message origin.

## Success Metrics
- Fast load times.
- Zero horizontal overflow on 390px devices.
- Immediate visual recognition of message source (badges).
- Clear 44px+ touch targets for interactivity.
