import React from 'react';
import { Box, Heading, Text, Button, VStack, HStack, Icon, Image } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { FaSearch, FaBookmark, FaChartLine, FaTags } from 'react-icons/fa';
import HeroImage from '../assets/HeroImage.webp';
import worriedImage1 from '../assets/worriedImage1.jpg';
import worriedImage2 from '../assets/worriedImage2.jpg';
import worriedImage3 from '../assets/worriedImage3.jpg';
import worriedImage4 from '../assets/worriedImage4.jpg';


const Home = () => {
  return (
    <Box p={5} bg='gray.50' minH='100vh'>
      <Box position='relative' textAlign='center' color='white'>
        <Image src={HeroImage} alt='Market Analytics' borderRadius='md' mb={6} />
        <Box position='absolute' top='30%' left='50%' transform='translate(-50%, -80%)' bg='teal.900' p={6} w='65%' maxW='80%' borderRadius='md' textAlign='center'>
          <Heading as='h1' fontSize='34px' mb={2}>
            MarketMaster: Your Ultimate Amazon Selling Assistent
          </Heading>
          <Text fontSize="28px" mb={6}>
            Empowering you to make informed decisions about what to sell on Amazon.
          </Text>
          <Button
            as={Link}
            to='/account'
            bg='brand.100'
            size='lg'
            fontWeight='bold'
          >
            Sign Up for Free
          </Button>
        </Box>
      </Box>

      <Box maxW='1200px' mx='auto' textAlign='center' py={20}>
        <Heading as='h2' size='xl' mb={6} color='teal.600'>
          Why MarketMaster?
        </Heading>
        <Text fontSize='28px' mb={6} color='gray.700'>
          MarketMaster provides you with essential market metrics and insights, helping you make data-driven decisions. Save your favorite products to keep track of market trends and get personalized product title suggestion. Are you unsure about which products to sell on Amazon? MarketMaster is here to help!
        </Text>
      </Box>

      <Box bg='gray.100' py={20}>
        <Box maxW='1200px' mx='auto' textAlign='center' py={20}>
          <Heading as='h2' size='xl' mb={6} color='teal.600'>
            If These Sound Like You, We've Got Your Back!
          </Heading>
          <br />
          <br />
          <br />
          <VStack spacing={10} justify='center' mb={6}>
            <Box maxW='1200px' textAlign='center' mb={6}>
              <HStack maxW='1000px' mx='auto' spacing={10} align='start'>
                <Image src={worriedImage1} alt='worried individual' boxSize='300px' />
                <Box textAlign="left">
                  <Heading as='h3' fontSize='28px' mt={8} mb={2}>
                    Feeling Overwhelmed by Information Overload.
                  </Heading>
                  <Text color='gray.700' fontSize='24px' mt={8}>
                    You're new to Amazon selling and overwhelmed by the product choices. MarketMaster helps you identify profitable products by providing essential market data, so you can make informed decisions. Avoid the trial-and-error process and start with products that have a proven track record.
                  </Text>
                </Box>
              </HStack>
            </Box>

            <Box maxW='1200px' textAlign='center' mb={6}>
              <HStack maxW='1000px' mx='auto' spacing={10} align='start' flexDirection='row-reverse'>
                <Image src={worriedImage2} alt='worried individual' boxSize='300px' />
                <Box textAlign="left">
                  <Heading as='h3' fontSize='28px' mt={8} mb={2}>
                    Facing Pricing Dilemma
                  </Heading>
                  <Text color='gray.700' fontSize='24px' mt={8} >
                    You're unsure about how to price your products competitively. MarketMaster offers insights into price ranges and average prices, helping you set competitive yet profitable prices. Understand what your competitors are charging and adjust your prices to stay ahead.
                  </Text>
                </Box>
              </HStack>
            </Box>

            <Box maxW='1200px' textAlign='center' mb={6}>
              <HStack maxW='1000px' mx='auto' spacing={10} align='start'>
                <Image src={worriedImage3} alt='worried individual' boxSize='300px' />
                <Box textAlign='left'>
                  <Heading as='h3' fontSize='28px' mt={8} mb={2}>
                    Losing Tracks of Products Performance
                  </Heading>
                  <Text color='gray.700' fontSize='24px' mt={8} >
                    You're struggling to track how well your competitors and your products are performing. MarketMaster provides detailed analytics on ratings and reviews, allowing you to gauge product performance and make necessary adjustments. Stay informed about customer feedback and improve your product offerings.
                  </Text>
                </Box>
              </HStack>
            </Box>

            <Box maxW='1200px' textAlign='center' mb={6}>
              <HStack maxW='1000px' mx='auto' spacing={10} align='start' flexDirection='row-reverse'>
                <Image src={worriedImage4} alt='worried individual' boxSize='300px' />
                <Box textAlign='left'>
                  <Heading as='h3' fontSize='28px' mt={8} mb={2}>
                    Not Having Enough Time to Monitor Market Products
                  </Heading>
                  <Text color='gray.700' fontSize='24px' mt={8} >
                    You want to keep an eye on certain products but lack an efficient system. MarketMaster lets you save products to your watchlist and monitor market changes easily. Never miss a price drop or a surge in demand again by keeping your favorite products within reach.
                  </Text>
                </Box>
              </HStack>
            </Box>
          </VStack>
        </Box>
      </Box>

      <Box maxW='1200px' mx='auto' textAlign='center' py={20}>
        <Heading as='h2' size='xl' mb={16} color='teal.600'>
          Key Features
        </Heading>
        <HStack spacing={10} justify='center'>
          <Box maxW='300px' textAlign='center'>
            <Icon as={FaSearch} boxSize={12} color='teal.500' mb={4} />
            <Heading as='h3' size='lg' mb={2}>
              Market Research
            </Heading>
            <Text color='brand.700' fontSize='24px'>
              Understand your competitors well to get ahead. Know who is selling similar products and important metrics you need to know about them.
            </Text>
          </Box>
          <Box maxW='300px' textAlign='center'>
            <Icon as={FaTags} boxSize={12} color='teal.500' mb={4} />
            <Heading as='h3' size='lg' mb={2}>
              Price Analysis
            </Heading>
            <Text color='brand.700' fontSize='24px'>
              Get insights into price ranges, distribution, and average prices. So that you can stay competitive with accurate price data.
            </Text>
          </Box>
          <Box maxW='300px' textAlign='center'>
            <Icon as={FaChartLine} boxSize={12} color='teal.500' mb={4} />
            <Heading as='h3' size='lg' mb={2}>
              Competitors Performance
            </Heading>
            <Text color='brand.700' fontSize='24px'>
              Analyze ratings and reviews to gauge product performance. Know your competitors performances so that you can strategize better and improves your chances of success.
            </Text>
          </Box>
          <Box maxW='300px' textAlign='center'>
            <Icon as={FaBookmark} boxSize={12} color='teal.500' mb={4} />
            <Heading as='h3' size='lg' mb={2}>
              Watchlist
            </Heading>
            <Text color='brand.700' fontSize='24px'>
              Save products to your watchlist to monitor market changes. Staying updated on market trends and never miss important market shifts.
            </Text>
          </Box>
        </HStack>
      </Box>

      <Box bg='teal.500' color='white' py={20} textAlign='center'>
        <Box maxW='1200px' mx='auto'>
          <Heading as='h2' size='xl' mb={6}>
            Ready to Take Your Amazon Business to the Next Level?
          </Heading>
          <Button
            as={Link}
            to='/search'
            bg='brand.100'
            size='lg'
            fontWeight='bold'
          >
            Search Now
          </Button>
        </Box>
      </Box>
      <br /><br />
      {/* <Box bg='gray.800' color='white' py={10}>
        <Box maxW='1200px' mx='auto' textAlign='center'>
          <Text>&copy; 2024 MarketMaster. All rights reserved.</Text>
          <HStack spacing={10} justify='center' mt={4}>
            <Link to='/privacy'>Privacy Policy</Link>
            <Link to='/terms'>Terms of Service</Link>
            <link to='/contact'>Contact Us</link>
          </HStack>
        </Box>
      </Box> */}

    </Box>

  );
};

export default Home;
