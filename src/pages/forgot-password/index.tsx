import React, { useState } from 'react';
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event: any) => {
    setInputValue(event.target.value);
  };

  const router = useRouter();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        px: '16px',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          '@media (min-width: 900px)': {
            width: '50%',
          },
          width: '100%',
          marginTop: '8rem',
        }}
      >
        <Box
          sx={{
            color: '#1F1B13',
            fontWeight: '400',
            fontSize: '22px',
            textAlign: 'center',
          }}
        >
          Trouble with logging in?
        </Box>
        <Box
          sx={{
            color: '#1F1B13',
            fontWeight: '400',
            fontSize: '14px',
            textAlign: 'center',
            mt: 0.5,
          }}
        >
          Enter your username or email address and we’ll send you a link to get
          back into your account.
        </Box>

        <Box
          sx={{
            width: '668px',
            '@media (max-width: 768px)': {
              width: '100%',
            },
            '@media (min-width: 900px)': {
              width: '100%',
            },
          }}
          margin={'3.2rem 0 0'}
        >
          <TextField
            id="Email"
            InputLabelProps={{
              shrink: true,
            }}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            className="password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    edge="end"
                  ></IconButton>
                </InputAdornment>
              ),
            }}
            label={'Enter username or email'}
          />
        </Box>

        <Box>
          <Box
            alignContent={'center'}
            textAlign={'center'}
            marginTop={'2.5rem'}
            width={'100%'}
          >
            <Button
              variant="contained"
              type="submit"
              fullWidth={true}
              disabled={!inputValue} // Disable button if inputValue is empty
              sx={{
                '@media (min-width: 900px)': {
                  width: '50%',
                },
              }}
              onClick={() => {
                router.push('/forgot-password/create-password');
              }}
            >
              Next
            </Button>
          </Box>
        </Box>

        <Box sx={{ mt: 10 }}>
          <Divider />
        </Box>
        <Box
          sx={{
            mt: 3,
            color: '#0D599E',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '500',
          }}
          onClick={() => {
            router.push('/login');
          }}
        >
          Back to Login
        </Box>
      </Box>
    </Box>
  );
};

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

export default ForgotPassword;
