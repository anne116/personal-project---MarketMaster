import React from 'react';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';

const TermsOfService = () => {
  return (
    <Box p={5} bg="gray.50" minH="100vh">
      <Box maxW="1200px" mx="auto" textAlign="left" py={20}>
        <Heading as="h1" size="2xl" mb={6} color="teal.600">
          Terms of Service
        </Heading>
        <VStack spacing={6} align="left">
          <Text fontSize="lg">
            Welcome to MarketMaster! By using our services, you agree to the following terms and conditions. Please read them carefully.
          </Text>

          <Heading as="h2" size="lg" mb={4} color="teal.500">
            Use of Services
          </Heading>
          <Text fontSize="md">
            You agree to use our services only for lawful purposes and in accordance with these Terms of Service. You are responsible for your conduct and any content you submit or share while using our services.
          </Text>

          <Heading as="h2" size="lg" mb={4} color="teal.500">
            Account Responsibilities
          </Heading>
          <Text fontSize="md">
            You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          </Text>

          <Heading as="h2" size="lg" mb={4} color="teal.500">
            Intellectual Property
          </Heading>
          <Text fontSize="md">
            All content and materials available on MarketMaster, including but not limited to text, graphics, logos, and software, are the property of MarketMaster or its licensors and are protected by intellectual property laws.
          </Text>

          <Heading as="h2" size="lg" mb={4} color="teal.500">
            Limitation of Liability
          </Heading>
          <Text fontSize="md">
            MarketMaster shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with the use of our services. Our total liability to you for any damages, losses, or causes of action shall not exceed the amount you have paid us in the past six months.
          </Text>

          <Heading as="h2" size="lg" mb={4} color="teal.500">
            Termination
          </Heading>
          <Text fontSize="md">
            We reserve the right to suspend or terminate your account and access to our services at our sole discretion, without notice, if you violate these Terms of Service or engage in any conduct that we deem inappropriate or harmful.
          </Text>

          <Heading as="h2" size="lg" mb={4} color="teal.500">
            Governing Law
          </Heading>
          <Text fontSize="md">
            These Terms of Service shall be governed by and construed in accordance with the laws of the jurisdiction in which MarketMaster operates, without regard to its conflict of law provisions.
          </Text>

          <Heading as="h2" size="lg" mb={4} color="teal.500">
            Changes to These Terms
          </Heading>
          <Text fontSize="md">
            We may update these Terms of Service from time to time. We will notify you of any changes by posting the new terms on our website. Your continued use of our services after any changes indicates your acceptance of the updated terms.
          </Text>

          <Heading as="h2" size="lg" mb={4} color="teal.500">
            Contact Us
          </Heading>
          <Text fontSize="md">
            If you have any questions or concerns about these Terms of Service, please contact us at support@marketmaster.com.
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default TermsOfService;
