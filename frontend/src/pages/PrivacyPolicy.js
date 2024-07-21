import React from "react";
import { Box, Heading, Text, VStack } from "@chakra-ui/react";

const PrivacyPolicy = () => {
  return (
    <Box p={5} bg="gray.50" minH="100vh">
      <Box maxW="1200px" mx="auto" textAlign="left" py={20}>
        <Heading as="h1" size="2xl" mb={6} color="teal.600">
          Privacy Policy
        </Heading>
        <VStack spacing={6} align="left">
          <Text fontSize="lg">
            At MarketMaster, we value your privacy and are committed to
            protecting your personal information. This Privacy Policy outlines
            how we collect, use, and safeguard your data.
          </Text>

          <Heading as="h2" size="lg" mb={4} color="teal.500">
            Information We Collect
          </Heading>
          <Text fontSize="md">
            We collect information that you provide directly to us, such as when
            you create an account, subscribe to our newsletter, or contact us
            for support. This may include your name, email address, and payment
            information. We also collect information automatically as you use
            our services, including your IP address, browser type, and usage
            data.
          </Text>

          <Heading as="h2" size="lg" mb={4} color="teal.500">
            How We Use Your Information
          </Heading>
          <Text fontSize="md">
            We use your information to provide, maintain, and improve our
            services, process transactions, communicate with you, and
            personalize your experience. We may also use your information to
            send you promotional content and updates.
          </Text>

          <Heading as="h2" size="lg" mb={4} color="teal.500">
            How We Share Your Information
          </Heading>
          <Text fontSize="md">
            We do not share your personal information with third parties except
            as necessary to provide our services, comply with legal obligations,
            or protect our rights. We may share anonymized data with partners
            for analytics and research purposes.
          </Text>

          <Heading as="h2" size="lg" mb={4} color="teal.500">
            Your Choices and Rights
          </Heading>
          <Text fontSize="md">
            You have the right to access, update, or delete your personal
            information. You can manage your communication preferences and
            opt-out of receiving promotional emails. To exercise your rights,
            please contact us at privacy@marketmaster.com.
          </Text>

          <Heading as="h2" size="lg" mb={4} color="teal.500">
            Changes to This Privacy Policy
          </Heading>
          <Text fontSize="md">
            We may update this Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on our website.
            Your continued use of our services after any changes indicates your
            acceptance of the updated policy.
          </Text>

          <Heading as="h2" size="lg" mb={4} color="teal.500">
            Contact Us
          </Heading>
          <Text fontSize="md">
            If you have any questions or concerns about this Privacy Policy,
            please contact us at privacy@marketmaster.com.
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default PrivacyPolicy;
