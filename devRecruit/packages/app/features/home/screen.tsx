'use client'

import { TextLink } from 'solito/link'
import { Text, View, ScrollView, Pressable, TextInput } from 'react-native'
import { useState } from 'react'

export function HomeScreen() {
  const [searchText, setSearchText] = useState('')
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null)
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)

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
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      {/* Navigation */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#d1d5db',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2
      }}>
        {/* Left side - Logo and Main Nav */}
        <View style={{ flexDirection: 'row', gap: 32, alignItems: 'center' }}>
          <TextLink href="/" style={{
            fontSize: 22,
            fontWeight: '700',
            color: '#1a1a1a',
            letterSpacing: -0.5
          }}>
            devrecruit
          </TextLink>
          
          <TextLink href="/browse" style={{ 
            color: '#5f6368', 
            fontSize: 15, 
            fontWeight: '500',
            textDecorationLine: 'none'
          }}>
            Browse
          </TextLink>
          <TextLink href="/how-it-works" style={{ 
            color: '#5f6368', 
            fontSize: 15, 
            fontWeight: '500',
            textDecorationLine: 'none'
          }}>
            How it Works
          </TextLink>
          <TextLink href="/community" style={{ 
            color: '#5f6368', 
            fontSize: 15, 
            fontWeight: '500',
            textDecorationLine: 'none'
          }}>
            Community
          </TextLink>
          <TextLink href="/docs" style={{ 
            color: '#5f6368', 
            fontSize: 15, 
            fontWeight: '500',
            textDecorationLine: 'none'
          }}>
            Docs
          </TextLink>
        </View>
        
        {/* Right Navigation */}
        <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}>
          <TextLink href="/signin" style={{ 
            color: '#5f6368', 
            fontSize: 15, 
            fontWeight: '500',
            textDecorationLine: 'none'
          }}>
            Log In
          </TextLink>
          <View style={{
            backgroundColor: '#1a73e8',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 6
          }}>
            <TextLink href="/join" style={{ 
              color: '#ffffff', 
              fontSize: 15, 
              fontWeight: '600',
              textDecorationLine: 'none'
            }}>
              Sign Up
            </TextLink>
          </View>
        </View>
      </View>

      {/* Hero Section */}
      <View style={{
        backgroundColor: '#ffffff',
        paddingHorizontal: 32,
        paddingVertical: 80,
        minHeight: 600
      }}>
        <View style={{ 
          maxWidth: 1400, 
          alignSelf: 'center',
          flexDirection: 'row',
          gap: 60,
          alignItems: 'center'
        }}>
          {/* Left Side - Main CTA */}
          <View style={{ flex: 1.2, gap: 32 }}>
            <Text style={{
              fontSize: 52,
              fontWeight: 'bold',
              color: '#202124',
              lineHeight: 62,
              letterSpacing: -0.5
            }}>
              Connect. Collaborate. Create.
            </Text>
            
            <Text style={{
              fontSize: 22,
              color: '#5f6368',
              lineHeight: 32,
              fontWeight: '400'
            }}>
              The developer marketplace where programmers connect with programmers. 
              Find the right coding expertise or offer your skills to fellow developers.
            </Text>

            {/* Action Buttons */}
            <View style={{
              flexDirection: 'row',
              gap: 16,
              maxWidth: 600
            }}>
              <Pressable 
                onMouseEnter={() => setHoveredButton('browse')}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  flex: 1,
                  backgroundColor: '#1a73e8',
                  paddingHorizontal: 32,
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: 'center',
                  shadowColor: '#1a73e8',
                  shadowOffset: { width: 0, height: hoveredButton === 'browse' ? 8 : 4 },
                  shadowOpacity: hoveredButton === 'browse' ? 0.4 : 0.3,
                  shadowRadius: hoveredButton === 'browse' ? 12 : 8,
                  elevation: hoveredButton === 'browse' ? 6 : 4,
                  transform: [{ scale: hoveredButton === 'browse' ? 1.02 : 1 }],
                  // @ts-ignore - React Native Web specific
                  transition: 'all 0.2s ease-in-out'
                }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
                  Browse Listings
                </Text>
              </Pressable>
              
              <Pressable 
                onMouseEnter={() => setHoveredButton('create')}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  flex: 1,
                  backgroundColor: '#ffffff',
                  borderWidth: 2,
                  borderColor: '#1a73e8',
                  paddingHorizontal: 32,
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: hoveredButton === 'create' ? 6 : 2 },
                  shadowOpacity: hoveredButton === 'create' ? 0.15 : 0.1,
                  shadowRadius: hoveredButton === 'create' ? 8 : 4,
                  elevation: hoveredButton === 'create' ? 4 : 2,
                  transform: [{ scale: hoveredButton === 'create' ? 1.02 : 1 }],
                  // @ts-ignore - React Native Web specific
                  transition: 'all 0.2s ease-in-out'
                }}>
                <Text style={{ color: '#1a73e8', fontSize: 18, fontWeight: '600' }}>
                  Create a Listing
                </Text>
              </Pressable>
            </View>

            {/* Popular Services */}
            <View style={{ gap: 16 }}>
              <Text style={{ color: '#5f6368', fontSize: 16, fontWeight: '500' }}>
                Popular collaborations:
              </Text>
              <View style={{ 
                flexDirection: 'row', 
                flexWrap: 'wrap', 
                gap: 12
              }}>
                {popularServices.slice(0, 6).map((service, index) => (
                  <Pressable
                    key={index}
                    style={{
                      backgroundColor: '#ffffff',
                      borderWidth: 1,
                      borderColor: '#c1c7cd',
                      borderRadius: 26,
                      paddingHorizontal: 18,
                      paddingVertical: 10,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2
                    }}
                  >
                    <Text style={{ color: '#374151', fontSize: 14, fontWeight: '500' }}>
                      {service}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Right Side - Job Listings */}
          <View style={{ flex: 1, gap: 20 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#202124',
              marginBottom: 8
            }}>
              Recent Listings
            </Text>
            
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 16
            }}>
              {sampleJobs.map((job, index) => (
                <Pressable
                  key={index}
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#c1c7cd',
                    borderRadius: 18,
                    padding: 20,
                    gap: 14,
                    width: '48%',
                    minHeight: 220,
                    shadowColor: '#000',
                    shadowOffset: { 
                      width: hoveredCard === index ? -2 : 0, 
                      height: hoveredCard === index ? 8 : 4 
                    },
                    shadowOpacity: hoveredCard === index ? 0.18 : 0.12,
                    shadowRadius: hoveredCard === index ? 12 : 8,
                    elevation: hoveredCard === index ? 5 : 3,
                    transform: [
                      { scale: hoveredCard === index ? 1.03 : 1 },
                      { translateY: hoveredCard === index ? -2 : 0 }
                    ],
                    // @ts-ignore - React Native Web specific
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <Text style={{
                    fontSize: 17,
                    fontWeight: '700',
                    color: '#1f2937',
                    lineHeight: 24
                  }}>
                    {job.title}
                  </Text>
                  
                  <Text style={{
                    fontSize: 14,
                    color: '#4b5563',
                    lineHeight: 20,
                    flex: 1
                  }}>
                    {job.description}
                  </Text>
                  
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {job.skills.map((skill, skillIndex) => (
                      <View
                        key={skillIndex}
                        style={{
                          backgroundColor: hoveredCard === index ? '#e0f2fe' : '#f8fafc',
                          borderWidth: 1,
                          borderColor: hoveredCard === index ? '#0ea5e9' : '#cbd5e1',
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          shadowColor: hoveredCard === index ? '#0ea5e9' : '#000',
                          shadowOffset: { width: 0, height: hoveredCard === index ? 1 : 0 },
                          shadowOpacity: hoveredCard === index ? 0.1 : 0,
                          shadowRadius: hoveredCard === index ? 2 : 0,
                          elevation: hoveredCard === index ? 1 : 0
                        }}
                      >
                        <Text style={{ color: '#475569', fontSize: 12, fontWeight: '600' }}>
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
                    <Text style={{ color: '#6b7280', fontSize: 12, fontWeight: '500' }}>
                      {job.timeframe} • by {job.poster}
                    </Text>
                    <View style={{
                      backgroundColor: '#1a73e8',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 10,
                      shadowColor: '#1a73e8',
                      shadowOffset: { width: 0, height: hoveredCard === index ? 4 : 2 },
                      shadowOpacity: hoveredCard === index ? 0.3 : 0.2,
                      shadowRadius: hoveredCard === index ? 6 : 4,
                      elevation: hoveredCard === index ? 3 : 2,
                      transform: [{ scale: hoveredCard === index ? 1.05 : 1 }]
                    }}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                        View Details
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Categories Section */}
      <View style={{
        backgroundColor: '#f1f5f9',
        paddingVertical: 80,
        paddingHorizontal: 32
      }}>
        <View style={{ maxWidth: 1200, alignSelf: 'center' }}>
          <Text style={{
            fontSize: 36,
            fontWeight: 'bold',
            color: '#202124',
            textAlign: 'center',
            marginBottom: 48
          }}>
            Browse by Technology
          </Text>

          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 24,
            justifyContent: 'center'
          }}>
            {categories.map((category, index) => (
                              <Pressable
                key={index}
                onMouseEnter={() => setHoveredCategory(index)}
                onMouseLeave={() => setHoveredCategory(null)}
                style={{
                  backgroundColor: '#ffffff',
                  borderWidth: 1,
                  borderColor: hoveredCategory === index ? '#1a73e8' : '#c1c7cd',
                  borderRadius: 18,
                  padding: 28,
                  minWidth: 200,
                  alignItems: 'center',
                  gap: 18,
                  shadowColor: '#000',
                  shadowOffset: { 
                    width: hoveredCategory === index ? -1 : 0, 
                    height: hoveredCategory === index ? 8 : 6 
                  },
                  shadowOpacity: hoveredCategory === index ? 0.2 : 0.15,
                  shadowRadius: hoveredCategory === index ? 16 : 12,
                  elevation: hoveredCategory === index ? 6 : 4,
                                                        transform: [
                     { scale: hoveredCategory === index ? 1.05 : 1 },
                     { translateY: hoveredCategory === index ? -3 : 0 }
                   ],
                   // @ts-ignore - React Native Web specific
                   transition: 'all 0.3s ease-in-out'
                }}
              >
                <View style={{
                  width: 56,
                  height: 56,
                  backgroundColor: '#1a73e8',
                  borderRadius: 28,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
                    {category.charAt(0)}
                  </Text>
                </View>
                <Text style={{
                  fontSize: 17,
                  fontWeight: '700',
                  color: '#1f2937',
                  textAlign: 'center'
                }}>
                  {category}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* How It Works Section */}
      <View style={{
        backgroundColor: '#ffffff',
        paddingVertical: 80,
        paddingHorizontal: 32
      }}>
        <View style={{ maxWidth: 1200, alignSelf: 'center' }}>
          <Text style={{
            fontSize: 36,
            fontWeight: 'bold',
            color: '#202124',
            textAlign: 'center',
            marginBottom: 48
          }}>
            How DevRecruit Works
          </Text>

          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: 40
          }}>
            {[
              {
                step: '1',
                title: 'Post Your Need',
                description: 'Describe the coding help you need or the skills you can offer to the community'
              },
              {
                step: '2',
                title: 'Connect & Match',
                description: 'Browse listings or get matched with developers who have the right expertise'
              },
              {
                step: '3',
                title: 'Collaborate & Build',
                description: 'Work together using integrated tools, communication, and project management'
              }
            ].map((item, index) => (
              <View key={index} style={{
                alignItems: 'center',
                maxWidth: 320,
                gap: 20
              }}>
                <View style={{
                  width: 72,
                  height: 72,
                  backgroundColor: '#1a73e8',
                  borderRadius: 36,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Text style={{
                    fontSize: 28,
                    fontWeight: 'bold',
                    color: '#fff'
                  }}>
                    {item.step}
                  </Text>
                </View>
                <Text style={{
                  fontSize: 22,
                  fontWeight: 'bold',
                  color: '#202124',
                  textAlign: 'center'
                }}>
                  {item.title}
                </Text>
                <Text style={{
                  fontSize: 16,
                  color: '#5f6368',
                  textAlign: 'center',
                  lineHeight: 26
                }}>
                  {item.description}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <View style={{
        backgroundColor: '#f1f5f9',
        paddingVertical: 60,
        paddingHorizontal: 32
      }}>
        <View style={{
          maxWidth: 800,
          alignSelf: 'center',
          alignItems: 'center',
          gap: 24
        }}>
          <Text style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: '#202124',
            textAlign: 'center'
          }}>
            Ready to connect with fellow developers?
          </Text>
          <Text style={{
            fontSize: 18,
            color: '#5f6368',
            textAlign: 'center',
            lineHeight: 28
          }}>
            Join thousands of developers already collaborating and building amazing projects together
          </Text>
          <Pressable 
            onMouseEnter={() => setHoveredButton('cta')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              backgroundColor: '#1a73e8',
              paddingHorizontal: 36,
              paddingVertical: 16,
              borderRadius: 14,
              shadowColor: '#1a73e8',
              shadowOffset: { width: 0, height: hoveredButton === 'cta' ? 6 : 4 },
              shadowOpacity: hoveredButton === 'cta' ? 0.4 : 0.3,
              shadowRadius: hoveredButton === 'cta' ? 12 : 8,
              elevation: hoveredButton === 'cta' ? 6 : 4,
              transform: [{ scale: hoveredButton === 'cta' ? 1.05 : 1 }],
              // @ts-ignore - React Native Web specific
              transition: 'all 0.2s ease-in-out'
            }}>
            <TextLink href="/join" style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: '700',
              textDecorationLine: 'none'
            }}>
              Get Started Today
            </TextLink>
          </Pressable>
        </View>
      </View>

      {/* Footer */}
      <View style={{
        backgroundColor: '#ffffff',
        paddingVertical: 40,
        paddingHorizontal: 32,
        borderTopWidth: 1,
        borderTopColor: '#c1c7cd'
      }}>
        <View style={{
          maxWidth: 1200,
          alignSelf: 'center',
          alignItems: 'center'
        }}>
          <Text style={{
            fontSize: 22,
            fontWeight: 'bold',
            color: '#1a73e8',
            marginBottom: 16
          }}>
            devrecruit
          </Text>
          <Text style={{
            color: '#9aa0a6',
            fontSize: 14,
            textAlign: 'center'
          }}>
            © 2024 DevRecruit. The developer marketplace built by developers, for developers.
          </Text>
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
