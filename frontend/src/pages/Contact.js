import React from "react";
import { Box, Heading, Text, VStack } from "@chakra-ui/react";
// import { Input, Textarea, Button, } from '@chakra-ui/react';

const Contact = () => {
  return (
    <Box p={5} bg="gray.50" minH="100vh">
      <Box maxW="1200px" mx="auto" textAlign="left" py={20}>
        <Heading as="h1" size="2xl" mb={6} color="teal.600">
          Contact Us
        </Heading>
        <VStack spacing={6} align="left">
          <Text fontSize="lg">
            We would love to hear from you! Whether you have a question about
            features, pricing, need a demo, or anything else, our team is ready
            to answer all your questions.
          </Text>

          <Heading as="h2" size="lg" mb={4} color="teal.500">
            Get in Touch
          </Heading>
          <Text fontSize="md">
            Email: contact@marketmaster.com
            <br />
            Phone: 02-1234-5678
          </Text>

          {/* <VStack spacing={4} align='left' w='100%'>
            <Input placeholder='Your Name' size='lg' />
            <Input placeholder='Your Email' size='lg' />
            <Textarea placeholder='Your Message' size='lg' />
            <Button colorScheme='teal' size='lg'>Send Message</Button>
          </VStack> */}

          <Heading as="h2" size="lg" mb={4} color="teal.500" mt={10}>
            Our Office
          </Heading>
          <Text fontSize="md">
            MarketMaster Inc.
            <br />
            1234 Market St.
            <br />
            Taipei City, Taiwan 104
            <br />
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default Contact;
