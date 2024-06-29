import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Box, Flex, IconButton, Image, Spacer, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react';
import { FaSearch, FaHome, FaBookmark, FaUser, FaBell } from 'react-icons/fa'; 
import MarketMasterLogo from '../assets/MarketMasterLogo.png';


const Header = () => {
  const [ notifications, setNotifications ] = useState([]);
  const [ newNotifications, setNewNotifications ] = useState(0);
  const [ ws, setWs ] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // console.log({ env: process.env })    
    const webSocketUrl = process.env.REACT_APP_WEBSOCKET_URL;
    const socket = new WebSocket(`${webSocketUrl}/ws`);

    socket.onopen = () => {
      console.log('Connected to WebSocket');
    };
    socket.onmessage = (event) => {
      console.log('Notification received:', event.data);
      const data = JSON.parse(event.data);
      console.log('Parsed data:', data)
      setNotifications((prev) => [...prev, data]);
      setNewNotifications((prev) => prev + 1);
    };
    socket.onclose = () => {
      console.log('Websocket connection closed.');
    };
    socket.error = (error) => {
      console.log('Websocket error:', error);
    };

    setWs(socket);

    return () => {
      socket.close();
    }
  }, []);

  const handleMenuOpen = () => {
    setNewNotifications(0);
  }

  const handleNotificationClick = (notification) => {
    setNotifications(notifications.filter(notif => notif !== notification));
    navigate(`/search?keyword=${notification.keyword}`);
  }
  

  return (
    <Box bg='brand.500' p={3}>
      <Flex maxW='1200px' mx='auto' align='center'>
        <Link to='/'>
          <Image src={MarketMasterLogo} alt='logo' boxSize='50px' />
        </Link>
        <Spacer />
        <Link to='/search'>
          <IconButton
            aria-label='Search'
            icon={<FaSearch />}
            color='white'
            fontSize='25px'
            bg='transparent'
            _hover={{ bg: 'brand.600' }}
            mx={2}
          />
        </Link>
        <Link to='/'>
          <IconButton
            aria-label='Home'
            icon={<FaHome />}
            color='white'
            fontSize='25px'
            bg='transparent'
            _hover={{ bg: 'brand.600' }}
            mx={2}
          />
        </Link>
        <Link to='/saved'>
          <IconButton
            aria-label='Saved List'
            icon={<FaBookmark />}
            color='white'
            fontSize='25px'
            bg='transparent'
            _hover={{ bg: 'brand.600' }}
            mx={2}
          />
        </Link>
        <Link to='/account'>
          <IconButton
            aria-label='Account'
            icon={<FaUser />}
            color='white'
            fontSize='25px'
            bg='transparent'
            _hover={{ bg: 'brand.600' }}
            mx={2}
          />
        </Link>
        <Menu onOpen={handleMenuOpen}>
          <MenuButton
            as={IconButton}
            aria-label='Notification'
            icon={
              <Box position='relative'>
                <FaBell />
                {newNotifications > 0 && (
                  <Badge
                    colorScheme='red'
                    borderRadius='full'
                    position='absolute'
                    top='-1'
                    right='-1'
                    fontSize='0.8em'
                  >
                    {newNotifications}
                  </Badge>
                )}
              </Box>
            }
            variant='ghost'
            color='white'
          />
          <MenuList>
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <MenuItem key={index} onClick={() => handleNotificationClick(notification)}>
                  {notification.message}
                </MenuItem>
              ))
            ) : (
              <MenuItem>No notifications</MenuItem>
            )}
          </MenuList>
        </Menu>
      </Flex>
    </Box>
  );
};

export default Header;
