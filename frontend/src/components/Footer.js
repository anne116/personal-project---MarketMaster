import React from 'react';
import { Box, Text, HStack } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <Box bg='brand.900' color='white' py={10} bottom={0} >
      <Box maxW='1200px' mx='auto' textAlign='center'>
        <Text>&copy; 2024 MarketMaster. All rights reserved.</Text>
        <HStack spacing={10} justify='center' mt={4}>
          <Link to='/privacy'>
            Privacy Policy
          </Link>
          <Link to='/terms'>
            Terms of Service
          </Link>
          <Link to='/contact'>
            Contact Us
          </Link>
        </HStack>
      </Box>
    </Box>
  );
};

export default Footer;
