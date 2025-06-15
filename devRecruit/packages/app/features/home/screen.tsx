'use client'

import { TextLink } from 'solito/link'
import { Text, View, ScrollView, Pressable, TextInput } from 'react-native'
import { useState } from 'react'

export function HomeScreen() {
  const [searchText, setSearchText] = useState('')
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null)
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)
  const [hoveredNavItem, setHoveredNavItem] = useState<string | null>(null)

  const categories = [
    'JavaScript', 'TypeScript', 'React', 'Python', 'Node.js', 'Vue.js', 
    'Angular', 'C++', 'Java', 'Go', 'Rust', 'Swift'
  ]

  const popularServices = [
    'frontend development', 'backend API', 'mobile app', 'code review',
    'bug fixing', 'database design', 'DevOps setup', 'testing'
  ]

  const sampleJobs = [
    {
      title: 'React Dashboard Component',
      description: 'Need help building a responsive admin dashboard with React and TypeScript',
      skills: ['React', 'TypeScript', 'CSS'],
      timeframe: '3-5 days',
      poster: 'Sarah M.'
    },
    {
      title: 'Node.js API Integration',
      description: 'Looking for someone to integrate third-party APIs into existing Node.js backend',
      skills: ['Node.js', 'Express', 'REST API'],
      timeframe: '1-2 weeks',
      poster: 'Mike D.'
    },
    {
      title: 'Python Data Processing',
      description: 'Help needed with data analysis and visualization using Python and pandas',
      skills: ['Python', 'Pandas', 'Data Analysis'],
      timeframe: '2-3 days',
      poster: 'Alex R.'
    },
    {
      title: 'Mobile App Bug Fixes',
      description: 'Several React Native bugs need fixing in iOS and Android app',
      skills: ['React Native', 'JavaScript', 'Mobile'],
      timeframe: '1-2 days',
      poster: 'Jamie L.'
    }
  ]

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fafbfc' }}>
      {/* Modern Navigation */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 48,
        paddingVertical: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2
      }}>
        {/* Left side - Logo and Main Nav */}
        <View style={{ flexDirection: 'row', gap: 48, alignItems: 'center' }}>
          <Pressable
            onHoverIn={() => setHoveredNavItem('logo')}
            onHoverOut={() => setHoveredNavItem(null)}
            style={{
              // @ts-ignore - React Native Web hover transition
              transition: 'all 0.2s ease-in-out',
              transform: [{ scale: hoveredNavItem === 'logo' ? 1.05 : 1 }]
            }}
          >
          <TextLink href="/" style={{
              fontSize: 28,
              fontWeight: '900',
              color: hoveredNavItem === 'logo' ? '#5b6cf0' : '#667eea',
              letterSpacing: -1,
              // @ts-ignore - React Native Web transition
              transition: 'color 0.2s ease-in-out'
          }}>
            devrecruit
          </TextLink>
          </Pressable>
          
          <View style={{ flexDirection: 'row', gap: 32, alignItems: 'center' }}>
            {[
              { label: 'Browse', href: '/browse' },
              { label: 'How it Works', href: '/how-it-works' },
              { label: 'Community', href: '/community' },
              { label: 'Docs', href: '/docs' }
            ].map((item) => (
              <Pressable
                key={item.label}
                onHoverIn={() => setHoveredNavItem(item.label)}
                onHoverOut={() => setHoveredNavItem(null)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: hoveredNavItem === item.label ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                  // @ts-ignore - React Native Web transitions
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: [{ translateY: hoveredNavItem === item.label ? -1 : 0 }]
                }}
              >
                <TextLink href={item.href} style={{ 
                  color: hoveredNavItem === item.label ? '#667eea' : '#64748b', 
            fontSize: 15, 
                  fontWeight: '600',
                  textDecorationLine: 'none',
                  // @ts-ignore - React Native Web transition
                  transition: 'color 0.2s ease-in-out'
                }}>
                  {item.label}
          </TextLink>
              </Pressable>
            ))}
          </View>
        </View>
        
        {/* Right Navigation */}
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <Pressable
            onHoverIn={() => setHoveredNavItem('signin')}
            onHoverOut={() => setHoveredNavItem(null)}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: hoveredNavItem === 'signin' ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
              // @ts-ignore - React Native Web transitions
              transition: 'all 0.2s ease-in-out',
              transform: [{ scale: hoveredNavItem === 'signin' ? 1.02 : 1 }]
            }}
          >
          <TextLink href="/signin" style={{ 
              color: hoveredNavItem === 'signin' ? '#374151' : '#64748b', 
            fontSize: 15, 
              fontWeight: '600',
              textDecorationLine: 'none',
              // @ts-ignore - React Native Web transition
              transition: 'color 0.2s ease-in-out'
          }}>
            Log In
          </TextLink>
          </Pressable>
          
          <Pressable
            onHoverIn={() => setHoveredNavItem('signup')}
            onHoverOut={() => setHoveredNavItem(null)}
            style={{
              backgroundColor: hoveredNavItem === 'signup' ? '#5b6cf0' : '#667eea',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
              shadowColor: '#667eea',
              shadowOffset: { width: 0, height: hoveredNavItem === 'signup' ? 6 : 4 },
              shadowOpacity: hoveredNavItem === 'signup' ? 0.3 : 0.2,
              shadowRadius: hoveredNavItem === 'signup' ? 12 : 8,
              elevation: hoveredNavItem === 'signup' ? 6 : 4,
              // @ts-ignore - React Native Web transitions
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: [{ 
                scale: hoveredNavItem === 'signup' ? 1.05 : 1,
                translateY: hoveredNavItem === 'signup' ? -2 : 0
              }]
            }}
          >
            <TextLink href="/join" style={{ 
              color: '#ffffff', 
              fontSize: 15, 
              fontWeight: '700',
              textDecorationLine: 'none'
            }}>
              Join Beta
            </TextLink>
          </Pressable>
        </View>
      </View>

      {/* Modern Hero Section with Hover Animations - Compact */}
      <View style={{
        backgroundColor: '#ffffff',
        paddingHorizontal: 48,
        paddingTop: 60,
        paddingBottom: 80,
        minHeight: 500
      }}>
        <View style={{ 
          maxWidth: 1200, 
          alignSelf: 'center',
          flexDirection: 'row',
          gap: 60,
          alignItems: 'center'
        }}>
          {/* Left Side - Hero Content */}
          <View style={{ flex: 1.2, gap: 28 }}>
            {/* Status Badge */}
            <Pressable
              onHoverIn={() => setHoveredButton('status')}
              onHoverOut={() => setHoveredButton(null)}
              style={{
                alignSelf: 'flex-start',
                backgroundColor: hoveredButton === 'status' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
                borderWidth: 1,
                borderColor: hoveredButton === 'status' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.2)',
                borderRadius: 24,
                paddingHorizontal: 20,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                // @ts-ignore - React Native Web transitions
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: [{ scale: hoveredButton === 'status' ? 1.05 : 1 }]
              }}
            >
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#22c55e'
              }} />
            <Text style={{
                color: '#22c55e',
                fontSize: 13,
                fontWeight: '700',
                letterSpacing: 0.3
              }}>
                Live Beta • 2,400+ Developers
            </Text>
            </Pressable>
            
            {/* Main Headline */}
            <View style={{ gap: 16 }}>
            <Text style={{
                fontSize: 48,
                fontWeight: '900',
                color: '#0f172a',
                lineHeight: 56,
                letterSpacing: -1.2
              }}>
                Connect.{'\n'}
                Collaborate.{'\n'}
                <Text style={{
                  // @ts-ignore - React Native Web gradient text
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  // @ts-ignore - React Native Web gradient text
                  WebkitBackgroundClip: 'text',
                  // @ts-ignore - React Native Web gradient text
                  WebkitTextFillColor: 'transparent',
                  // @ts-ignore - React Native Web gradient text
                  backgroundClip: 'text'
                }}>
                  Create.
                </Text>
            </Text>

              <Text style={{
                fontSize: 18,
                color: '#64748b',
                lineHeight: 28,
                fontWeight: '500',
                maxWidth: 480
              }}>
                Connect with skilled developers for quick collaborations, code reviews, and project partnerships. From bug fixes to full-stack builds.
              </Text>
            </View>

            {/* CTA Buttons */}
            <View style={{
              flexDirection: 'row',
              gap: 16,
              alignItems: 'center'
            }}>
              <Pressable 
                onHoverIn={() => setHoveredButton('primary-cta')}
                onHoverOut={() => setHoveredButton(null)}
                style={{
                  backgroundColor: hoveredButton === 'primary-cta' ? '#5b6cf0' : '#667eea',
                  paddingHorizontal: 28,
                  paddingVertical: 14,
                  borderRadius: 14,
                  shadowColor: '#667eea',
                  shadowOffset: { width: 0, height: hoveredButton === 'primary-cta' ? 10 : 6 },
                  shadowOpacity: hoveredButton === 'primary-cta' ? 0.35 : 0.25,
                  shadowRadius: hoveredButton === 'primary-cta' ? 16 : 12,
                  elevation: hoveredButton === 'primary-cta' ? 6 : 4,
                  // @ts-ignore - React Native Web transitions
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: [
                    { scale: hoveredButton === 'primary-cta' ? 1.03 : 1 },
                    { translateY: hoveredButton === 'primary-cta' ? -2 : 0 }
                  ]
                }}
              >
                <TextLink href="/join" style={{
                  color: '#ffffff',
                  fontSize: 15,
                  fontWeight: '700',
                  textDecorationLine: 'none',
                  letterSpacing: 0.3
                }}>
                  Start Collaborating
                </TextLink>
              </Pressable>
              
              <Pressable 
                onHoverIn={() => setHoveredButton('secondary-cta')}
                onHoverOut={() => setHoveredButton(null)}
                style={{
                  backgroundColor: hoveredButton === 'secondary-cta' ? '#f8fafc' : '#ffffff',
                  borderWidth: 2,
                  borderColor: hoveredButton === 'secondary-cta' ? '#667eea' : '#e2e8f0',
                  paddingHorizontal: 28,
                  paddingVertical: 12,
                  borderRadius: 14,
                  shadowColor: hoveredButton === 'secondary-cta' ? '#667eea' : '#000',
                  shadowOffset: { width: 0, height: hoveredButton === 'secondary-cta' ? 6 : 3 },
                  shadowOpacity: hoveredButton === 'secondary-cta' ? 0.15 : 0.08,
                  shadowRadius: hoveredButton === 'secondary-cta' ? 12 : 8,
                  elevation: hoveredButton === 'secondary-cta' ? 3 : 2,
                  // @ts-ignore - React Native Web transitions
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: [
                    { scale: hoveredButton === 'secondary-cta' ? 1.02 : 1 },
                    { translateY: hoveredButton === 'secondary-cta' ? -1 : 0 }
                  ]
                }}
              >
                <TextLink href="/browse" style={{
                  color: hoveredButton === 'secondary-cta' ? '#667eea' : '#64748b',
                  fontSize: 15,
                  fontWeight: '600',
                  textDecorationLine: 'none',
                  letterSpacing: 0.2,
                  // @ts-ignore - React Native Web transition
                  transition: 'color 0.2s ease-in-out'
                }}>
                  Browse Projects
                </TextLink>
              </Pressable>
            </View>

            {/* Popular Services Tag */}
                  <Pressable
              onHoverIn={() => setHoveredButton('popular-tag')}
              onHoverOut={() => setHoveredButton(null)}
                    style={{
                alignSelf: 'flex-start',
                backgroundColor: hoveredButton === 'popular-tag' ? 'rgba(102, 126, 234, 0.12)' : 'rgba(102, 126, 234, 0.08)',
                      borderWidth: 1,
                borderColor: hoveredButton === 'popular-tag' ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.15)',
                borderRadius: 18,
                paddingHorizontal: 14,
                paddingVertical: 6,
                // @ts-ignore - React Native Web transitions
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: [{ scale: hoveredButton === 'popular-tag' ? 1.05 : 1 }]
              }}
            >
              <Text style={{
                color: hoveredButton === 'popular-tag' ? '#667eea' : '#64748b',
                fontSize: 11,
                fontWeight: '600',
                letterSpacing: 0.3,
                // @ts-ignore - React Native Web transition
                transition: 'color 0.2s ease-in-out'
              }}>
                🔥 Popular: {popularServices.slice(0, 4).join(' • ')}
                    </Text>
                  </Pressable>
          </View>

          {/* Right Side - Compact Live Projects */}
          <View style={{ flex: 1, gap: 20 }}>
            <View style={{ gap: 8 }}>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                gap: 8 
              }}>
            <Text style={{
              fontSize: 24,
                  fontWeight: '800',
                  color: '#0f172a',
                  letterSpacing: -0.6
                }}>
                  Live Projects
            </Text>
                {/* Pulsing Dot */}
                <View style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#667eea',
                  shadowColor: '#667eea',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: 3,
                  elevation: 2,
                  // @ts-ignore - React Native Web animation
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }} />
              </View>
              <Text style={{
                fontSize: 14,
                color: '#64748b',
                fontWeight: '500'
              }}>
                Real collaborations happening now
              </Text>
            </View>
            
            <View style={{
              flexDirection: 'column',
              gap: 16
            }}>
              {sampleJobs.slice(0, 2).map((job, index) => (
                <Pressable
                  key={index}
                  onHoverIn={() => setHoveredCard(index)}
                  onHoverOut={() => setHoveredCard(null)}
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: hoveredCard === index ? '#667eea' : '#e2e8f0',
                    borderRadius: 16,
                    padding: 20,
                    gap: 12,
                    shadowColor: hoveredCard === index ? '#667eea' : '#000',
                    shadowOffset: { width: 0, height: hoveredCard === index ? 8 : 3 },
                    shadowOpacity: hoveredCard === index ? 0.15 : 0.06,
                    shadowRadius: hoveredCard === index ? 16 : 8,
                    elevation: hoveredCard === index ? 4 : 2,
                    // @ts-ignore - React Native Web transitions
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: [
                      { scale: hoveredCard === index ? 1.02 : 1 },
                      { translateY: hoveredCard === index ? -3 : 0 }
                    ]
                  }}
                >
                  <View style={{ gap: 8 }}>
                  <Text style={{
                      fontSize: 16,
                    fontWeight: '700',
                      color: hoveredCard === index ? '#667eea' : '#0f172a',
                      lineHeight: 20,
                      // @ts-ignore - React Native Web transition
                      transition: 'color 0.2s ease-in-out'
                  }}>
                    {job.title}
                  </Text>
                  
                  <Text style={{
                      fontSize: 13,
                      color: '#64748b',
                      lineHeight: 18
                  }}>
                    {job.description}
                  </Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {job.skills.slice(0, 3).map((skill, skillIndex) => (
                      <View
                        key={skillIndex}
                        style={{
                          backgroundColor: hoveredCard === index ? 'rgba(102, 126, 234, 0.15)' : '#f8fafc',
                          borderWidth: 1,
                          borderColor: hoveredCard === index ? 'rgba(102, 126, 234, 0.4)' : '#e2e8f0',
                          borderRadius: 6,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          // @ts-ignore - React Native Web transition
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        <Text style={{ 
                          color: hoveredCard === index ? '#667eea' : '#64748b', 
                          fontSize: 10, 
                          fontWeight: '600',
                          // @ts-ignore - React Native Web transition
                          transition: 'color 0.2s ease-in-out'
                        }}>
                          {skill}
                        </Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 4
                  }}>
                    <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '500' }}>
                      {job.timeframe} • by {job.poster}
                    </Text>
                    <View style={{
                      backgroundColor: hoveredCard === index ? '#667eea' : '#f1f5f9',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 6,
                      shadowColor: hoveredCard === index ? '#667eea' : 'transparent',
                      shadowOffset: { width: 0, height: hoveredCard === index ? 2 : 0 },
                      shadowOpacity: hoveredCard === index ? 0.2 : 0,
                      shadowRadius: hoveredCard === index ? 3 : 0,
                      elevation: hoveredCard === index ? 1 : 0,
                      // @ts-ignore - React Native Web transitions
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: [{ scale: hoveredCard === index ? 1.05 : 1 }]
                    }}>
                      <Text style={{ 
                        color: hoveredCard === index ? '#fff' : '#64748b', 
                        fontSize: 9, 
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: 0.3,
                        // @ts-ignore - React Native Web transition
                        transition: 'color 0.2s ease-in-out'
                      }}>
                        View
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Popular Services Section - Compact Design */}
      <View style={{
        backgroundColor: '#f8fafc',
        paddingVertical: 70,
        paddingHorizontal: 55
      }}>
        <View style={{ maxWidth: 1380, alignSelf: 'center' }}>
          {/* Compact Language Cards - Horizontal Scroll */}
          <View style={{
            marginBottom: 55,
            position: 'relative'
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20
            }}>
              {/* Left Arrow */}
              <Pressable
                onPress={() => {
                  const scrollAmount = 300;
                  // @ts-ignore - React Native Web scroll behavior
                  document.getElementById('language-scroll')?.scrollBy({
                    left: -scrollAmount,
                    behavior: 'smooth'
                  });
                }}
                onHoverIn={() => setHoveredButton('scroll-left')}
                onHoverOut={() => setHoveredButton(null)}
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: hoveredButton === 'scroll-left' ? '#667eea' : '#ffffff',
                  borderRadius: 22,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: hoveredButton === 'scroll-left' ? '#667eea' : '#e2e8f0',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: hoveredButton === 'scroll-left' ? 0.15 : 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                  // @ts-ignore - React Native Web transitions
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: [
                    { scale: hoveredButton === 'scroll-left' ? 1.05 : 1 }
                  ],
                  zIndex: 10
                }}
              >
          <Text style={{
                  fontSize: 18,
                  color: hoveredButton === 'scroll-left' ? '#ffffff' : '#64748b',
                  fontWeight: 'bold'
                }}>
                  ←
                </Text>
              </Pressable>

              {/* Scrollable Language Container with Fade Effects */}
              <View style={{
                flex: 1,
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Left Fade Gradient */}
                <View style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 40,
                  zIndex: 5,
                  // @ts-ignore - React Native Web gradient
                  background: 'linear-gradient(to right, rgba(248, 250, 252, 1) 0%, rgba(248, 250, 252, 0) 100%)',
                  pointerEvents: 'none'
                }} />

                {/* Right Fade Gradient */}
                <View style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 40,
                  zIndex: 5,
                  // @ts-ignore - React Native Web gradient
                  background: 'linear-gradient(to left, rgba(248, 250, 252, 1) 0%, rgba(248, 250, 252, 0) 100%)',
                  pointerEvents: 'none'
                }} />

                <View
                  // @ts-ignore - React Native Web scroll properties
                  id="language-scroll"
                  style={{
                    flexDirection: 'row',
                    gap: 14,
                    paddingHorizontal: 50,
                    // @ts-ignore - React Native Web scroll properties
                    overflowX: 'auto',
                    scrollBehavior: 'smooth',
                    // @ts-ignore - React Native Web scroll properties
                    scrollbarWidth: 'none',
                    // @ts-ignore - React Native Web scroll properties
                    msOverflowStyle: 'none'
                  }}
                >
                  {[
                    { name: 'JavaScript', icon: '🟨', color: '#f7df1e' },
                    { name: 'React', icon: '⚛️', color: '#61dafb' },
                    { name: 'Python', icon: '🐍', color: '#3776ab' },
                    { name: 'C++', icon: '⚡', color: '#00599c' },
                    { name: 'HTML/CSS', icon: '🌐', color: '#e34f26' },
                    { name: 'TypeScript', icon: '🔷', color: '#3178c6' },
                    { name: 'Java', icon: '☕', color: '#ed8b00' },
                    { name: 'SQL', icon: '🗄️', color: '#336791' },
                    { name: 'C', icon: '🔧', color: '#a8b9cc' },
                    { name: 'Ruby', icon: '💎', color: '#cc342d' },
                    { name: 'C#', icon: '🔷', color: '#239120' }
                  ].map((language, index) => (
                    <Pressable
                      key={index}
                      onHoverIn={() => setHoveredButton(`lang-${index}`)}
                      onHoverOut={() => setHoveredButton(null)}
                      style={{
                        backgroundColor: '#ffffff',
                        borderWidth: 1,
                        borderColor: hoveredButton === `lang-${index}` ? language.color : '#e2e8f0',
                        borderRadius: 14,
                        padding: 18,
                        minWidth: 138,
                        alignItems: 'center',
                        gap: 9,
                        shadowColor: hoveredButton === `lang-${index}` ? language.color : '#000',
                        shadowOffset: { 
                          width: 0, 
                          height: hoveredButton === `lang-${index}` ? 5 : 2 
                        },
                        shadowOpacity: hoveredButton === `lang-${index}` ? 0.15 : 0.05,
                        shadowRadius: hoveredButton === `lang-${index}` ? 9 : 5,
                        elevation: hoveredButton === `lang-${index}` ? 3 : 1,
                        // @ts-ignore - React Native Web transitions
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: [
                          { scale: hoveredButton === `lang-${index}` ? 1.02 : 1 },
                          { translateY: hoveredButton === `lang-${index}` ? -2 : 0 }
                        ],
                        // @ts-ignore - React Native Web flex properties
                        flexShrink: 0
                      }}
                    >
                      <View style={{
                        width: 46,
                        height: 46,
                        backgroundColor: hoveredButton === `lang-${index}` ? `${language.color}15` : '#f8fafc',
                        borderRadius: 9,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: hoveredButton === `lang-${index}` ? `${language.color}30` : '#e2e8f0'
                      }}>
                        <Text style={{ fontSize: 21 }}>
                          {language.icon}
                        </Text>
                      </View>
                      
                      <View style={{ alignItems: 'center', gap: 2 }}>
                        <Text style={{
                          fontSize: 15,
                          fontWeight: '700',
                          color: hoveredButton === `lang-${index}` ? language.color : '#0f172a',
                          textAlign: 'center'
                        }}>
                          {language.name}
                        </Text>
                        
                        <Text style={{
                          fontSize: 11,
                          color: '#64748b',
                          fontWeight: '500',
                          textAlign: 'center'
                        }}>
                          {Math.floor(Math.random() * 500) + 200}+ devs
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Right Arrow */}
              <Pressable
                onPress={() => {
                  const scrollAmount = 300;
                  // @ts-ignore - React Native Web scroll behavior
                  document.getElementById('language-scroll')?.scrollBy({
                    left: scrollAmount,
                    behavior: 'smooth'
                  });
                }}
                onHoverIn={() => setHoveredButton('scroll-right')}
                onHoverOut={() => setHoveredButton(null)}
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: hoveredButton === 'scroll-right' ? '#667eea' : '#ffffff',
                  borderRadius: 22,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: hoveredButton === 'scroll-right' ? '#667eea' : '#e2e8f0',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: hoveredButton === 'scroll-right' ? 0.15 : 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                  // @ts-ignore - React Native Web transitions
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: [
                    { scale: hoveredButton === 'scroll-right' ? 1.05 : 1 }
                  ],
                  zIndex: 10
                }}
              >
                <Text style={{
                  fontSize: 18,
                  color: hoveredButton === 'scroll-right' ? '#ffffff' : '#64748b',
                  fontWeight: 'bold'
                }}>
                  →
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={{ marginBottom: 46, gap: 9 }}>
            <Text style={{
              fontSize: 37,
              fontWeight: '800',
              color: '#0f172a',
            textAlign: 'center',
              letterSpacing: -0.9
          }}>
              Popular Services
          </Text>
            <Text style={{
              fontSize: 18,
              color: '#64748b',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              Discover the most in-demand development services
            </Text>
          </View>

          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 18,
            justifyContent: 'center'
          }}>
            {[
              { 
                name: 'Website Development', 
                color: '#22c55e', 
                icon: '💻',
                description: 'Full-stack web applications',
                popular: true
              },
              { 
                name: 'Mobile App Development', 
                color: '#3b82f6', 
                icon: '📱',
                description: 'iOS & Android applications',
                popular: true
              },
              { 
                name: 'API Development', 
                color: '#f59e0b', 
                icon: '🔌',
                description: 'RESTful & GraphQL APIs',
                popular: false
              },
              { 
                name: 'UI/UX Design', 
                color: '#ec4899', 
                icon: '🎨',
                description: 'User interface & experience',
                popular: true
              },
              { 
                name: 'DevOps & Cloud', 
                color: '#8b5cf6', 
                icon: '☁️',
                description: 'Infrastructure & deployment',
                popular: false
              },
              { 
                name: 'Data Science', 
                color: '#06b6d4', 
                icon: '📊',
                description: 'Analytics & machine learning',
                popular: false
              }
            ].map((service, index) => (
                              <Pressable
                key={index}
                onHoverIn={() => setHoveredCategory(index)}
                onHoverOut={() => setHoveredCategory(null)}
                style={{
                  backgroundColor: hoveredCategory === index ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)',
                  borderWidth: 1,
                  borderColor: hoveredCategory === index ? service.color : 'rgba(226, 232, 240, 0.8)',
                  borderRadius: 18,
                  padding: 23,
                  minWidth: 276,
                  minHeight: 184,
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 14,
                  shadowColor: hoveredCategory === index ? service.color : '#000',
                  shadowOffset: { 
                    width: 0, 
                    height: hoveredCategory === index ? 9 : 3 
                  },
                  shadowOpacity: hoveredCategory === index ? 0.12 : 0.04,
                  shadowRadius: hoveredCategory === index ? 18 : 9,
                  elevation: hoveredCategory === index ? 4 : 2,
                  // @ts-ignore - React Native Web transitions
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        transform: [
                    { scale: hoveredCategory === index ? 1.02 : 1 },
                    { translateY: hoveredCategory === index ? -5 : 0 }
                  ]
                }}
              >
                {/* Popular badge */}
                {service.popular && (
                <View style={{
                    position: 'absolute',
                    top: -7,
                    right: 14,
                    backgroundColor: service.color,
                    paddingHorizontal: 9,
                    paddingVertical: 2,
                    borderRadius: 9,
                    shadowColor: service.color,
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.3,
                    shadowRadius: 2,
                    elevation: 2,
                    zIndex: 2
                  }}>
                    <Text style={{
                      color: '#ffffff',
                      fontSize: 9,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: 0.3
                    }}>
                      HOT
                    </Text>
                  </View>
                )}

                {/* Service Icon & Title */}
                <View style={{ gap: 14, alignItems: 'flex-start', flex: 1 }}>
                  <View style={{
                    width: 55,
                    height: 55,
                    backgroundColor: `${service.color}15`,
                    borderWidth: 1,
                    borderColor: `${service.color}30`,
                    borderRadius: 14,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                    <Text style={{ fontSize: 23 }}>
                      {service.icon}
                  </Text>
                </View>
                  
                  <View style={{ gap: 7 }}>
                <Text style={{
                      fontSize: 18,
                  fontWeight: '700',
                      color: '#0f172a',
                      lineHeight: 23,
                      letterSpacing: -0.3
                    }}>
                      {service.name}
                    </Text>
                    
                    <Text style={{
                      fontSize: 14,
                      color: '#64748b',
                      fontWeight: '500',
                      lineHeight: 18
                    }}>
                      {service.description}
                    </Text>
                  </View>
                </View>

                {/* Compact CTA */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  marginTop: 'auto'
                }}>
                  <Pressable style={{
                    backgroundColor: hoveredCategory === index ? service.color : 'rgba(102, 126, 234, 0.08)',
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 9,
                    borderWidth: 1,
                    borderColor: hoveredCategory === index ? service.color : 'rgba(102, 126, 234, 0.15)'
                  }}>
                    <Text style={{
                      color: hoveredCategory === index ? '#ffffff' : '#667eea',
                      fontSize: 13,
                      fontWeight: '700',
                      letterSpacing: 0.2
                    }}>
                      Explore →
                </Text>
                  </Pressable>
                  
                  <View style={{
                    backgroundColor: hoveredCategory === index ? `${service.color}20` : '#f8fafc',
                    paddingHorizontal: 9,
                    paddingVertical: 5,
                    borderRadius: 7,
                    borderWidth: 1,
                    borderColor: hoveredCategory === index ? `${service.color}40` : '#e2e8f0'
                  }}>
                    <Text style={{
                      color: hoveredCategory === index ? service.color : '#64748b',
                      fontSize: 11,
                      fontWeight: '600'
                    }}>
                      {Math.floor(Math.random() * 150) + 50}+ projects
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
          
          {/* Compact Bottom CTA */}
          <View style={{
            alignItems: 'center',
            marginTop: 46
          }}>
            <Pressable style={{
              backgroundColor: '#667eea',
              paddingHorizontal: 28,
              paddingVertical: 14,
              borderRadius: 14,
              shadowColor: '#667eea',
              shadowOffset: { width: 0, height: 5 },
              shadowOpacity: 0.2,
              shadowRadius: 9,
              elevation: 4
            }}>
              <Text style={{
                color: '#ffffff',
                fontSize: 16,
                fontWeight: '700',
                letterSpacing: 0.2
              }}>
                View All Services
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* How DevRecruit Works - Compact Design */}
      <View style={{
        backgroundColor: '#ffffff',
        paddingVertical: 60,
        paddingHorizontal: 48
      }}>
        <View style={{ maxWidth: 1200, alignSelf: 'center' }}>
          {/* Section Header */}
          <View style={{ alignItems: 'center', marginBottom: 40, gap: 12 }}>
            <View style={{
              backgroundColor: '#f8fafc',
              borderWidth: 1,
              borderColor: '#e2e8f0',
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 4
            }}>
          <Text style={{
                color: '#667eea',
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 0.5,
                textTransform: 'uppercase'
              }}>
                How It Works
              </Text>
            </View>

            <Text style={{
              fontSize: 32,
              fontWeight: '800',
              color: '#0f172a',
            textAlign: 'center',
              letterSpacing: -0.8,
              lineHeight: 38
            }}>
              Connect.{' '}
              <Text style={{
                // @ts-ignore - React Native Web gradient text
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                // @ts-ignore - React Native Web gradient text
                WebkitBackgroundClip: 'text',
                // @ts-ignore - React Native Web gradient text
                WebkitTextFillColor: 'transparent',
                // @ts-ignore - React Native Web gradient text
                backgroundClip: 'text'
              }}>
                Collaborate.
              </Text>
          </Text>

            <Text style={{
              fontSize: 16,
              color: '#64748b',
              textAlign: 'center',
              maxWidth: 480,
              lineHeight: 24,
              fontWeight: '500'
            }}>
              Three simple steps to find your coding partner and build amazing projects together
            </Text>
          </View>

          {/* Steps Grid */}
          <View style={{
            flexDirection: 'row',
            gap: 24,
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {[
              {
                step: '01',
                icon: '💡',
                title: 'Share Your Idea',
                description: 'Post your project concept and collaboration needs.',
                color: '#22c55e'
              },
              {
                step: '02',
                icon: '🤝',
                title: 'Find Your Partner',
                description: 'Connect with developers who complement your skills.',
                color: '#3b82f6'
              },
              {
                step: '03',
                icon: '🚀',
                title: 'Build Together',
                description: 'Collaborate and create something amazing as a team.',
                color: '#8b5cf6'
              }
            ].map((item, index) => (
              <Pressable
                key={index}
                onHoverIn={() => setHoveredCard(index + 10)}
                onHoverOut={() => setHoveredCard(null)}
                style={{
                  backgroundColor: hoveredCard === index + 10 ? '#fafbfc' : '#ffffff',
                  borderWidth: 2,
                  borderColor: hoveredCard === index + 10 ? item.color : '#e2e8f0',
                  borderRadius: 12,
                  padding: 20,
                  maxWidth: 280,
                  minHeight: 180,
                  gap: 14,
                  // @ts-ignore - React Native Web transitions
                  transition: 'all 0.2s ease-in-out',
                  transform: [
                    { translateY: hoveredCard === index + 10 ? -3 : 0 }
                  ]
                }}
              >
                {/* Step Number & Icon Row */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
              }}>
                <View style={{
                    backgroundColor: item.color,
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Text style={{
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: '800',
                      letterSpacing: -0.2
                  }}>
                    {item.step}
                  </Text>
                </View>

                  <View style={{
                    width: 40,
                    height: 40,
                    backgroundColor: `${item.color}10`,
                    borderRadius: 8,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: `${item.color}20`
                  }}>
                    <Text style={{ fontSize: 20 }}>
                      {item.icon}
                    </Text>
                  </View>
                </View>

                {/* Content */}
                <View style={{ gap: 8, flex: 1 }}>
                <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: '#0f172a',
                    letterSpacing: -0.2
                }}>
                  {item.title}
                </Text>

                <Text style={{
                    fontSize: 14,
                    color: '#64748b',
                    lineHeight: 20,
                    fontWeight: '500'
                }}>
                  {item.description}
                </Text>
              </View>

                {/* Simple Arrow */}
                <View style={{
                  alignSelf: 'flex-end',
                  backgroundColor: hoveredCard === index + 10 ? item.color : '#f1f5f9',
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  justifyContent: 'center',
                  alignItems: 'center',
                  // @ts-ignore - React Native Web transitions
                  transition: 'all 0.2s ease-in-out'
                }}>
                  <Text style={{
                    color: hoveredCard === index + 10 ? '#ffffff' : '#64748b',
                    fontSize: 12,
                    fontWeight: '600',
                    // @ts-ignore - React Native Web transition
                    transition: 'color 0.2s ease-in-out'
                  }}>
                    →
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Bottom CTA */}
          <View style={{
            alignItems: 'center',
            marginTop: 40
          }}>
            <Pressable
              onHoverIn={() => setHoveredButton('works-cta')}
              onHoverOut={() => setHoveredButton(null)}
              style={{
                backgroundColor: hoveredButton === 'works-cta' ? '#5b6cf0' : '#667eea',
                paddingHorizontal: 28,
                paddingVertical: 12,
                borderRadius: 10,
                // @ts-ignore - React Native Web transitions
                transition: 'all 0.2s ease-in-out',
                transform: [
                  { scale: hoveredButton === 'works-cta' ? 1.02 : 1 }
                ]
              }}
            >
              <TextLink href="/join" style={{
                color: '#ffffff',
                fontSize: 15,
                fontWeight: '700',
                textDecorationLine: 'none',
                letterSpacing: 0.2
              }}>
                Start Collaborating Today
              </TextLink>
            </Pressable>
          </View>
        </View>
      </View>

      {/* CTA Section - Light Background */}
      <View style={{
        backgroundColor: '#f8fafc',
        paddingVertical: 80,
        paddingHorizontal: 48,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.03,
          // @ts-ignore - React Native Web background
          background: 'radial-gradient(circle at 20% 30%, #667eea 0%, transparent 50%), radial-gradient(circle at 80% 70%, #764ba2 0%, transparent 50%)'
        }} />

        <View style={{
          maxWidth: 1200,
          alignSelf: 'center',
          alignItems: 'center',
          gap: 32,
          position: 'relative',
          zIndex: 1
        }}>
          <Text style={{
            fontSize: 48,
            fontWeight: '800',
            color: '#1e293b',
            textAlign: 'center',
            letterSpacing: -1.2,
            lineHeight: 56,
            maxWidth: 800
          }}>
            Developer collaboration at your{' '}
          <Text style={{
              color: '#667eea',
              fontWeight: '800'
            }}>
              fingertips
          </Text>
          </Text>

          <Pressable 
            onHoverIn={() => setHoveredButton('main-cta')}
            onHoverOut={() => setHoveredButton(null)}
            style={{
              // @ts-ignore - React Native Web gradient background
              background: hoveredButton === 'main-cta' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              paddingHorizontal: 40,
              paddingVertical: 16,
              borderRadius: 12,
              shadowColor: '#667eea',
              shadowOffset: { width: 0, height: hoveredButton === 'main-cta' ? 8 : 4 },
              shadowOpacity: hoveredButton === 'main-cta' ? 0.3 : 0.2,
              shadowRadius: hoveredButton === 'main-cta' ? 16 : 12,
              elevation: hoveredButton === 'main-cta' ? 6 : 4,
              borderWidth: 2,
              borderColor: 'transparent',
              // @ts-ignore - React Native Web transitions
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: [
                { scale: hoveredButton === 'main-cta' ? 1.05 : 1 },
                { translateY: hoveredButton === 'main-cta' ? -2 : 0 }
              ]
            }}>
            <TextLink href="/join" style={{
              color: '#ffffff',
              fontSize: 18,
              fontWeight: '700',
              textDecorationLine: 'none',
              letterSpacing: 0.3,
              // @ts-ignore - React Native Web transition
              transition: 'all 0.2s ease-in-out'
            }}>
              Join DevRecruit
            </TextLink>
          </Pressable>

          {/* Additional Info - With Dots */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 24,
            marginTop: 16,
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8
            }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#10b981'
              }} />
              <Text style={{
                color: '#64748b',
                fontSize: 14,
                fontWeight: '600'
              }}>
                2,400+ Active Developers
              </Text>
        </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8
            }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#667eea'
              }} />
              <Text style={{
                color: '#64748b',
                fontSize: 14,
                fontWeight: '600'
              }}>
                500+ Projects Completed
              </Text>
      </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8
            }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#f472b6'
              }} />
              <Text style={{
                color: '#64748b',
                fontSize: 14,
                fontWeight: '600'
              }}>
                Free to Join
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer - Fiverr Style */}
      <View style={{
        backgroundColor: '#ffffff',
        paddingVertical: 60,
        paddingHorizontal: 48,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0'
      }}>
        <View style={{
          maxWidth: 1400,
          alignSelf: 'center'
        }}>
          {/* Footer Columns */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 40,
            marginBottom: 48
          }}>
            {/* Popular Services Column */}
            <View style={{ minWidth: 200, flex: 1 }}>
          <Text style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: 20,
                letterSpacing: -0.2
              }}>
                Popular Services
          </Text>
              <View style={{ gap: 12 }}>
                {[
                  'Website Development',
                  'Mobile App Development',
                  'API Development',
                  'UI/UX Design',
                  'DevOps & Cloud',
                  'Data Science',
                  'Code Review',
                  'Bug Fixing'
                ].map((service, index) => (
                  <Pressable
                    key={index}
                    onHoverIn={() => setHoveredButton(`footer-service-${index}`)}
                    onHoverOut={() => setHoveredButton(null)}
                  >
                    <TextLink href={`/services/${service.toLowerCase().replace(/\s+/g, '-')}`} style={{
                      fontSize: 14,
                      color: hoveredButton === `footer-service-${index}` ? '#667eea' : '#64748b',
                      fontWeight: '500',
                      textDecorationLine: 'none',
                      // @ts-ignore - React Native Web transition
                      transition: 'color 0.2s ease-in-out'
                    }}>
                      {service}
                    </TextLink>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Programming Languages Column */}
            <View style={{ minWidth: 200, flex: 1 }}>
          <Text style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: 20,
                letterSpacing: -0.2
              }}>
                Programming Languages
              </Text>
              <View style={{ gap: 12 }}>
                {[
                  'JavaScript',
                  'Python',
                  'React',
                  'TypeScript',
                  'Java',
                  'C++',
                  'Node.js',
                  'SQL'
                ].map((language, index) => (
                  <Pressable
                    key={index}
                    onHoverIn={() => setHoveredButton(`footer-lang-${index}`)}
                    onHoverOut={() => setHoveredButton(null)}
                  >
                    <TextLink href={`/developers/${language.toLowerCase()}`} style={{
            fontSize: 14,
                      color: hoveredButton === `footer-lang-${index}` ? '#667eea' : '#64748b',
                      fontWeight: '500',
                      textDecorationLine: 'none',
                      // @ts-ignore - React Native Web transition
                      transition: 'color 0.2s ease-in-out'
                    }}>
                      {language}
                    </TextLink>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* For Developers Column */}
            <View style={{ minWidth: 200, flex: 1 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: 20,
                letterSpacing: -0.2
              }}>
                For Developers
          </Text>
              <View style={{ gap: 12 }}>
                {[
                  'How DevRecruit Works',
                  'Join as Developer',
                  'Success Stories',
                  'Community Hub',
                  'Developer Resources',
                  'Collaboration Tools',
                  'Project Guidelines',
                  'Developer Events'
                ].map((item, index) => (
                  <Pressable
                    key={index}
                    onHoverIn={() => setHoveredButton(`footer-dev-${index}`)}
                    onHoverOut={() => setHoveredButton(null)}
                  >
                    <TextLink href={`/${item.toLowerCase().replace(/\s+/g, '-')}`} style={{
                      fontSize: 14,
                      color: hoveredButton === `footer-dev-${index}` ? '#667eea' : '#64748b',
                      fontWeight: '500',
                      textDecorationLine: 'none',
                      // @ts-ignore - React Native Web transition
                      transition: 'color 0.2s ease-in-out'
                    }}>
                      {item}
                    </TextLink>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* For Project Owners Column */}
            <View style={{ minWidth: 200, flex: 1 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: 20,
                letterSpacing: -0.2
              }}>
                For Project Owners
              </Text>
              <View style={{ gap: 12 }}>
                {[
                  'Post a Project',
                  'Find Developers',
                  'Project Management',
                  'Quality Assurance',
                  'Trust & Safety',
                  'Collaboration Best Practices',
                  'Project Templates',
                  'Success Metrics'
                ].map((item, index) => (
                  <Pressable
                    key={index}
                    onHoverIn={() => setHoveredButton(`footer-owner-${index}`)}
                    onHoverOut={() => setHoveredButton(null)}
                  >
                    <TextLink href={`/${item.toLowerCase().replace(/\s+/g, '-')}`} style={{
                      fontSize: 14,
                      color: hoveredButton === `footer-owner-${index}` ? '#667eea' : '#64748b',
                      fontWeight: '500',
                      textDecorationLine: 'none',
                      // @ts-ignore - React Native Web transition
                      transition: 'color 0.2s ease-in-out'
                    }}>
                      {item}
                    </TextLink>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Company Column */}
            <View style={{ minWidth: 200, flex: 1 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: 20,
                letterSpacing: -0.2
              }}>
                Company
              </Text>
              <View style={{ gap: 12 }}>
                {[
                  'About DevRecruit',
                  'Careers',
                  'Press & News',
                  'Investor Relations',
                  'Terms of Service',
                  'Privacy Policy',
                  'Help & Support',
                  'Contact Us'
                ].map((item, index) => (
                  <Pressable
                    key={index}
                    onHoverIn={() => setHoveredButton(`footer-company-${index}`)}
                    onHoverOut={() => setHoveredButton(null)}
                  >
                    <TextLink href={`/${item.toLowerCase().replace(/\s+/g, '-')}`} style={{
                      fontSize: 14,
                      color: hoveredButton === `footer-company-${index}` ? '#667eea' : '#64748b',
                      fontWeight: '500',
                      textDecorationLine: 'none',
                      // @ts-ignore - React Native Web transition
                      transition: 'color 0.2s ease-in-out'
                    }}>
                      {item}
                    </TextLink>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Footer Bottom */}
          <View style={{
            borderTopWidth: 1,
            borderTopColor: '#e2e8f0',
            paddingTop: 32,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 20
          }}>
            {/* Logo and Copyright */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
              <TextLink href="/" style={{
                fontSize: 24,
                fontWeight: '900',
                color: '#667eea',
                textDecorationLine: 'none',
                letterSpacing: -0.8
              }}>
                devrecruit
              </TextLink>
              <Text style={{
                color: '#94a3b8',
                fontSize: 14,
                fontWeight: '500'
              }}>
                © 2024 DevRecruit Ltd.
              </Text>
            </View>

            {/* Social Links */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16
            }}>
              {[
                { name: 'GitHub', icon: '🐙', url: 'https://github.com/devrecruit' },
                { name: 'Twitter', icon: '🐦', url: 'https://twitter.com/devrecruit' },
                { name: 'LinkedIn', icon: '💼', url: 'https://linkedin.com/company/devrecruit' },
                { name: 'Discord', icon: '💬', url: 'https://discord.gg/devrecruit' }
              ].map((social, index) => (
                <Pressable
                  key={index}
                  onHoverIn={() => setHoveredButton(`social-${index}`)}
                  onHoverOut={() => setHoveredButton(null)}
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: hoveredButton === `social-${index}` ? '#667eea' : '#f8fafc',
                    borderRadius: 8,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: hoveredButton === `social-${index}` ? '#667eea' : '#e2e8f0',
                    // @ts-ignore - React Native Web transitions
                    transition: 'all 0.2s ease-in-out',
                    transform: [{ scale: hoveredButton === `social-${index}` ? 1.05 : 1 }]
                  }}
                >
                  <Text style={{ fontSize: 16 }}>
                    {social.icon}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
      </View>
    </View>
    </ScrollView>
  )
}

const H1 = ({ children }: { children: React.ReactNode }) => {
  return <Text style={{ fontWeight: '800', fontSize: 24 }}>{children}</Text>
}

const P = ({ children }: { children: React.ReactNode }) => {
  return <Text style={{ textAlign: 'center' }}>{children}</Text>
}
