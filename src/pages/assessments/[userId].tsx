import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { useTheme, Theme } from '@mui/material/styles';
import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  Select,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { logEvent } from '@/utils/googleAnalytics';
import KeyboardBackspaceOutlinedIcon from '@mui/icons-material/KeyboardBackspaceOutlined';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { getAssessmentSubjects } from '@/services/UpdateAssesmentService';
import { Assessments } from '@/utils/Interfaces';
import { useRouter } from 'next/router';

function AssessmentsDetails() {
  const theme = useTheme<any>();
  const { t } = useTranslation();
  const router = useRouter();
  const [assessmentListSubject, setAssessmentListSubject] = useState<
    Assessments[]
  >([]);

  const handleBackEvent = () => {
    window.history.back();
    logEvent({
      action: 'back-button-clicked-attendance-overview',
      category: 'Attendance Overview Page',
      label: 'Back Button Clicked',
    });
  };

  useEffect(() => {
    logEvent({
      action: 'page-loaded-attendance-overview',
      category: 'Attendance Overview Page',
      label: 'Page Loaded',
    });
  }, []);

  useEffect(() => {
    const res: any = getAssessmentSubjects();
    setAssessmentListSubject(res);
  }, []);
  const handleAssessmentSubjectDetails = (userId: string) => {
    router.push(`./subjectDetail/${userId}`);

    console.log();
  };

  return (
    <>
      <Header />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'left',
          alignItems: 'center',
          color: '#4D4639',
          padding: '15px 20px 5px',
        }}
        width={'100%'}
        onClick={handleBackEvent}
      >
        <KeyboardBackspaceOutlinedIcon
          cursor={'pointer'}
          sx={{ color: theme.palette.warning['A200'] }}
        />
        <Typography textAlign={'left'} fontSize={'22px'} m={'1rem'}>
          userName
        </Typography>
      </Box>

      <Grid container>
        <Grid item xs={12} md={6}>
          <Box sx={{ px: '20px' }}>
            <FormControl fullWidth>
              <InputLabel
                style={{
                  color: theme?.palette?.warning['A200'],
                  background: theme?.palette?.warning['A400'],
                  paddingLeft: '2px',
                  paddingRight: '2px',
                }}
                id="demo-simple-select-label"
              >
                {t('ASSESSMENTS.ASSESSMENT_TYPE')}
              </InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                label={t('ASSESSMENTS.ASSESSMENT_TYPE')}
                style={{ borderRadius: '4px' }}
              >
                {/* <MenuItem value={'Mathematics'}>Mathematics</MenuItem> */}
              </Select>
            </FormControl>
          </Box>
        </Grid>
      </Grid>

      <Box
        sx={{
          mt: 2,
          px: '16px',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        <CheckCircleIcon sx={{ color: '#1F1B13', fontSize: '22px' }} />
        <Box sx={{ fontSize: '14px', fontWeight: '400', color: '#4D4639' }}>
          Completed
        </Box>
      </Box>

      <Box
        sx={{
          mt: 2,
          color: '#1F1B13',
          fontWeight: 500,
          fontSize: '14px',
          px: '16px',
        }}
      >
        Overall Score : 420/475 (88%)
      </Box>
      <Box sx={{ mt: 2, background: '#FBF4E4', padding: '16px' }}>
        <Grid container spacing={2}>
          {assessmentListSubject.map((assessment) => (
            <Grid item xs={12} sm={6} md={4} key={assessment.userId}>
              <Box
                sx={{
                  border: '1px solid #D0C5B4',
                  background: '#fff',
                  padding: '14px',
                  borderRadius: '8px',
                }}
                onClick={() =>
                  handleAssessmentSubjectDetails(assessment?.userId)
                }
              >
                <Box
                  sx={{ fontSize: '16px', fontWeight: '400', color: '#1F1B13' }}
                >
                  {assessment.subject}
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    pt: '4px',
                  }}
                >
                  <Box
                    sx={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#1F1B13',
                    }}
                  >
                    {assessment.score}
                  </Box>
                  <FiberManualRecordIcon
                    sx={{ fontSize: '12px', color: '#7C766F' }}
                  />
                  <Box
                    sx={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#7C766F',
                    }}
                  >
                    {assessment.date}
                  </Box>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </>
  );
}

export async function getStaticPaths() {
  const paths = [
    { params: { userId: '1' } },
    { params: { userId: '2' } },
    { params: { userId: '3' } },
  ];

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({
  params,
  locale,
}: {
  params: any;
  locale: string;
}) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

export default AssessmentsDetails;
