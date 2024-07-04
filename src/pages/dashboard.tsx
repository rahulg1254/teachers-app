'use client';

import {
  AttendancePercentageProps,
  cohort,
  cohortAttendancePercentParam,
  cohortMemberList,
} from '../utils/Interfaces';
import { Box, Button, Grid, Stack, Typography } from '@mui/material';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import React, { useEffect } from 'react';
import {
  classesMissedAttendancePercentList,
  getAllCenterAttendance,
  getCohortAttendance,
} from '../services/AttendanceService';
import { format, isAfter, isValid, parse, startOfDay } from 'date-fns';
import {
  formatSelectedDate,
  getTodayDate,
  shortDateFormat,
  toPascalCase,
} from '../utils/Helper';

import ArrowForwardSharpIcon from '@mui/icons-material/ArrowForwardSharp';
import CohortSelectionSection from '@/components/CohortSelectionSection';
import Divider from '@mui/material/Divider';
import GuideTour from '@/components/GuideTour';
import Header from '../components/Header';
import Image from 'next/image';
import Link from 'next/link';
import Loader from '../components/Loader';
import MarkBulkAttendance from '@/components/MarkBulkAttendance';
import OverviewCard from '@/components/OverviewCard';
import ReactGA from 'react-ga4';
import WeekCalender from '@/components/WeekCalender';
import { calculatePercentage } from '@/utils/attendanceStats';
import calendar from '../assets/images/calendar.svg';
import { getMyCohortMemberList } from '@/services/MyClassDetailsService';
import { logEvent } from '@/utils/googleAnalytics';
import { lowLearnerAttendanceLimit } from './../../app.config';
import { modifyAttendanceLimit } from '../../app.config';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { showToastMessage } from '@/components/Toastify';
import { useCohortList } from '@/services/queries';
import useDeterminePathColor from '../hooks/useDeterminePathColor';
import { useRouter } from 'next/navigation';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'next-i18next';

interface DashboardProps {
  //   buttonText: string;
}

const Dashboard: React.FC<DashboardProps> = () => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [cohortsData, setCohortsData] = React.useState<Array<cohort>>([]);
  const [manipulatedCohortData, setManipulatedCohortData] =
    React.useState<Array<cohort>>(cohortsData);
  const [classId, setClassId] = React.useState('');
  const [showDetails, setShowDetails] = React.useState(false);
  const [handleSaveHasRun, setHandleSaveHasRun] = React.useState(false);
  const [selectedDate, setSelectedDate] =
    React.useState<string>(getTodayDate());
  const [percentageAttendanceData, setPercentageAttendanceData] =
    React.useState<any>(null);
  const [attendanceStats, setAttendanceStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [cohortPresentPercentage, setCohortPresentPercentage] =
    React.useState<string>(t('ATTENDANCE.N/A'));
  const [lowAttendanceLearnerList, setLowAttendanceLearnerList] =
    React.useState<any>(t('ATTENDANCE.N/A'));
  const [startDateRange, setStartDateRange] = React.useState<Date | string>('');
  const [endDateRange, setEndDateRange] = React.useState<Date | string>('');
  const [dateRange, setDateRange] = React.useState<Date | string>('');
  const [allCenterAttendanceData, setAllCenterAttendanceData] =
    React.useState<any>(cohortsData);
  const [isClient, setIsClient] = React.useState(false);
  const router = useRouter();
  const theme = useTheme<any>();
  const determinePathColor = useDeterminePathColor();
  const currentDate = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(currentDate.getDate() - modifyAttendanceLimit);
  const formattedSevenDaysAgo = shortDateFormat(sevenDaysAgo);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [blockName, setBlockName] = React.useState<string>('');

  useEffect(() => {
    setIsClient(true);
    const calculateDateRange = () => {
      const endRangeDate = new Date();
      endRangeDate.setHours(23, 59, 59, 999);
      const startRangeDate = new Date(endRangeDate);
      startRangeDate.setDate(startRangeDate.getDate() - 6);
      startRangeDate.setHours(0, 0, 0, 0);
      const startDay = startRangeDate.getDate();
      const startDayMonth = startRangeDate.toLocaleString('default', {
        month: 'long',
      });
      const endDay = endRangeDate.getDate();
      const endDayMonth = endRangeDate.toLocaleString('default', {
        month: 'long',
      });
      if (startDayMonth == endDayMonth) {
        setDateRange(`(${startDay}-${endDay} ${endDayMonth})`);
      } else {
        setDateRange(`(${startDay} ${startDayMonth}-${endDay} ${endDayMonth})`);
      }

      setStartDateRange(shortDateFormat(startRangeDate));
      setEndDateRange(shortDateFormat(endRangeDate));
    };

    calculateDateRange();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('token');
      const storedUserId = localStorage.getItem('userId');
      setClassId(localStorage.getItem('classId') || '');
      if (token) {
        setIsAuthenticated(true);
      } else {
        router.push('/login');
      }
      setUserId(storedUserId);
    }
  }, []);

  const limit = 0;
  const page = 0;
  const filters = { userId: userId || '' };

  //API for getting student list
  useEffect(() => {
    const getCohortMemberList = async () => {
      setLoading(true);
      try {
        if (classId && classId !== 'all') {
          const limit = 300;
          const page = 0;
          const filters = { cohortId: classId };
          const response = await getMyCohortMemberList({
            limit,
            page,
            filters,
          });
          const resp = response?.result?.results?.userDetails;
          if (resp) {
            const nameUserIdArray = resp?.map((entry: any) => ({
              userId: entry.userId,
              name: toPascalCase(entry.name),
            }));
            if (nameUserIdArray) {
              //Logic to call class missed api
              const fromDate = startDateRange;
              const toDate = endDateRange;
              const filters = {
                contextId: classId,
                fromDate,
                toDate,
                scope: 'student',
              };
              const response = await classesMissedAttendancePercentList({
                filters,
                facets: ['userId'],
                sort: ['absent_percentage', 'asc'],
              });
              const resp = response?.data?.result?.userId;
              if (resp) {
                const filteredData = Object.keys(resp).map((userId) => ({
                  userId,
                  absent: resp[userId].absent,
                  present_percent: resp[userId].present_percentage,
                }));
                if (nameUserIdArray && filteredData) {
                  let mergedArray = filteredData.map((attendance) => {
                    const user = nameUserIdArray.find(
                      (user: { userId: string }) =>
                        user.userId === attendance.userId
                    );
                    return Object.assign({}, attendance, {
                      name: user ? user.name : 'Unknown',
                    });
                  });
                  mergedArray = mergedArray.filter(
                    (item) => item.name !== 'Unknown'
                  );
                  const studentsWithLowestAttendance = mergedArray.filter(
                    (user) =>
                      user.absent &&
                      (user.present_percent < lowLearnerAttendanceLimit ||
                        user.present_percent === undefined)
                  );

                  // Extract names of these students
                  if (studentsWithLowestAttendance.length) {
                    const namesOfLowestAttendance: any[] =
                      studentsWithLowestAttendance.map(
                        (student) => student.name
                      );
                    setLowAttendanceLearnerList(namesOfLowestAttendance);
                  } else {
                    setLowAttendanceLearnerList([]);
                  }
                }
              }
            }
          }
          if (classId) {
            const cohortAttendancePercent = async () => {
              const cohortAttendanceData: cohortAttendancePercentParam = {
                limit: 0,
                page: 0,
                filters: {
                  scope: 'student',
                  fromDate: startDateRange,
                  toDate: endDateRange,
                  contextId: classId,
                },
                facets: ['contextId'],
                sort: ['present_percentage', 'asc'],
              };
              const res = await getCohortAttendance(cohortAttendanceData);
              const response = res?.data?.result;
              const contextData =
                response?.contextId && response?.contextId[classId];
              if (contextData?.present_percentage) {
                const presentPercent = contextData?.present_percentage;
                setCohortPresentPercentage(presentPercent);
              } else if (contextData?.absent_percentage) {
                setCohortPresentPercentage('0');
              } else {
                setCohortPresentPercentage(t('ATTENDANCE.N/A'));
              }
            };
            cohortAttendancePercent();
          }
        } else if (classId && classId === 'all' && cohortsData) {
          const cohortIds = cohortsData.map((cohort) => cohort.cohortId);
          const limit = 300;
          const page = 0;
          const facets = ['contextId'];

          const fetchAttendanceData = async (cohortIds: any[]) => {
            const fetchPromises = cohortIds.map(async (cohortId) => {
              const filters = {
                fromDate: startDateRange,
                toDate: endDateRange,
                scope: 'student',
                contextId: cohortId,
              };
              // console.log('Filters:', filters);

              try {
                const response = await getAllCenterAttendance({
                  limit,
                  page,
                  filters,
                  facets,
                });
                return { cohortId, data: response?.data?.result };
              } catch (error) {
                console.error(
                  `Error fetching data for cohortId ${cohortId}:`,
                  error
                );
                showToastMessage(t('COMMON.SOMETHING_WENT_WRONG'), 'error');
                return { cohortId, error };
              }
            });

            try {
              const results = await Promise.all(fetchPromises);
              console.log('Fetched data:', results);

              const nameIDAttendanceArray = results
                .filter(
                  (result) =>
                    !result?.error && result?.data && result?.data?.contextId
                )
                .map((result) => {
                  const cohortId = result?.cohortId;
                  const contextData = result?.data?.contextId[cohortId] || {};
                  const presentPercentage =
                    contextData.present_percentage || null;
                  const absentPercentage = contextData?.absent_percentage
                    ? 100 - contextData?.absent_percentage
                    : null;
                  const percentage = presentPercentage || absentPercentage;

                  const cohortItem = cohortsData.find(
                    (cohort) => cohort?.cohortId === cohortId
                  );

                  return {
                    userId: cohortId,
                    name: cohortItem ? cohortItem.name : null,
                    presentPercentage: percentage,
                  };
                })
                .filter((item) => item.presentPercentage !== null); // Filter out items with no valid percentage

              // console.log('Filtered and merged data:', nameIDAttendanceArray);
              setAllCenterAttendanceData(nameIDAttendanceArray);
            } catch (error) {
              console.error('Error fetching attendance data:', error);
              showToastMessage(t('COMMON.SOMETHING_WENT_WRONG'), 'error');
            }
          };

          fetchAttendanceData(cohortIds);
        }
      } catch (error) {
        console.error('Error fetching cohort list:', error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    if (classId?.length) {
      getCohortMemberList();
    }
  }, [classId, selectedDate, handleSaveHasRun]);

  const showDetailsHandle = (dayStr: string) => {
    setSelectedDate(formatSelectedDate(dayStr));
    setShowDetails(true);
  };

  const handleModalToggle = () => {
    setOpen(!open);
    logEvent({
      action: 'mark/modify-attendance-button-clicked-dashboard',
      category: 'Dashboard Page',
      label: 'Mark/ Modify Attendance',
    });
  };

  const getMonthName = (dateString: string) => {
    try {
      const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
      if (!isValid(parsedDate)) {
        throw new Error('Invalid Date');
      }
      localStorage.setItem('selectedMonth', parsedDate.toISOString());
      return format(parsedDate, 'MMMM');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  useEffect(() => {
    const getAttendanceStats = async () => {
      if (classId !== '' && classId !== 'all') {
        const cohortMemberRequest: cohortMemberList = {
          limit: 300,
          page: 0,
          filters: {
            cohortId: classId,
            role: 'Student',
          },
        };
        const currentDate = new Date();
        const dayOfWeek = currentDate.getDay();
        const diffToMonday =
          currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const weekStartDate = new Date(currentDate.setDate(diffToMonday));
        const startDate = new Date(
          currentDate.setDate(currentDate.getDate() - 30)
        );
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(weekStartDate);
        endDate.setDate(weekStartDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        const fromDateFormatted = shortDateFormat(startDate);
        const toDateFormatted = shortDateFormat(endDate);
        const attendanceRequest: AttendancePercentageProps = {
          limit: 300,
          page: 0,
          filters: {
            contextId: classId,
            fromDate: fromDateFormatted,
            toDate: toDateFormatted,
            scope: 'student',
          },
          facets: ['attendanceDate'],
        };
        const attendanceStats = await calculatePercentage(
          cohortMemberRequest,
          attendanceRequest
        );
        setPercentageAttendanceData(attendanceStats);
        setAttendanceStats(attendanceStats);
        console.log('attendanceStats', attendanceStats);
      }
    };
    getAttendanceStats();
  }, [classId && classId !== 'all', selectedDate, handleSaveHasRun]);

  const viewAttendanceHistory = () => {
    if (classId !== 'all') {
      router.push('/attendance-history');
      ReactGA.event('month-name-clicked', { selectedCohortID: classId });
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const todayDate = getTodayDate();

  let currentAttendance = attendanceStats?.[todayDate] || 'notMarked';
  const isFutureDateWithoutTime = (date: Date | string) => {
    const today = startOfDay(new Date());
    date = startOfDay(new Date(date));
    return isAfter(date, today);
  };

  if (selectedDate) {
    if (isFutureDateWithoutTime(selectedDate)) {
      currentAttendance = 'futureDate';
    } else {
      currentAttendance = attendanceStats?.[selectedDate] || 'notMarked';
    }
  }
  const presentPercentage = parseFloat(currentAttendance?.present_percentage);
  const pathColor = determinePathColor(presentPercentage);

  const handleMoreDetailsClicked = () => {
    logEvent({
      action: 'more-details-button-clicked',
      category: 'Dashboard Page',
      label: 'More Details Link Clicked',
    });
  };
  let hasSeenTutorial = false;
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedValue = localStorage.getItem('hasSeenTutorial');
    if (storedValue !== null) {
      hasSeenTutorial = storedValue === 'true'; // Convert string 'true' or 'false' to boolean
    }
  }
  return (
    <>
      {isClient && (
        <>
          <GuideTour />
          <>
            {!isAuthenticated && (
              <Loader showBackdrop={true} loadingText={t('COMMON.LOADING')} />
            )}

            {isAuthenticated && (
              <Box minHeight="100vh">
                <Box>
                  <Header />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box
                    display={'flex'}
                    width={'100%'}
                    sx={{ backgroundColor: 'white' }}
                  >
                    <Typography
                      textAlign={'left'}
                      fontSize={'22px'}
                      m={'1.5rem 1.2rem 0.8rem'}
                      color={theme?.palette?.warning['300']}
                      className="joyride-step-1"
                    >
                      {t('DASHBOARD.DASHBOARD')}
                    </Typography>
                  </Box>
                </Box>
                {loading && (
                  <Loader
                    showBackdrop={true}
                    loadingText={t('COMMON.LOADING')}
                  />
                )}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box
                    paddingBottom={'25px'}
                    width={'100%'}
                    className="linerGradient br-md-8"
                  >
                    <Box
                      display={'flex'}
                      flexDirection={'column'}
                      padding={'1.5rem 1.2rem 1rem'}
                    >
                      <Box display={'flex'} justifyContent={'space-between'}>
                        <Typography
                          variant="h2"
                          sx={{ fontSize: '14px' }}
                          color={'black'}
                          fontWeight={'500'}
                        >
                          {t('DASHBOARD.DAY_WISE_ATTENDANCE')}
                        </Typography>
                        <Box
                          className="calenderTitle flex-center joyride-step-2"
                          display={'flex'}
                          sx={{
                            cursor: 'pointer',
                            color: theme.palette.secondary.main,
                            gap: '4px',
                            opacity: classId === 'all' ? 0.5 : 1,
                          }}
                          onClick={viewAttendanceHistory}
                        >
                          <Typography
                            marginBottom={'0'}
                            style={{ fontWeight: '500' }}
                          >
                            {getMonthName(selectedDate)}
                          </Typography>
                          {/* <CalendarMonthIcon /> */}
                          <Image
                            height={18}
                            width={18}
                            src={calendar}
                            alt="logo"
                            style={{ cursor: 'pointer' }}
                          />
                        </Box>
                      </Box>
                      <CohortSelectionSection
                        classId={classId}
                        setClassId={setClassId}
                        userId={userId}
                        setUserId={setUserId}
                        isAuthenticated={isAuthenticated}
                        setIsAuthenticated={setIsAuthenticated}
                        loading={loading}
                        setLoading={setLoading}
                        cohortsData={cohortsData}
                        setCohortsData={setCohortsData}
                        manipulatedCohortData={manipulatedCohortData}
                        setManipulatedCohortData={setManipulatedCohortData}
                        blockName={blockName}
                        setBlockName={setBlockName}
                        handleSaveHasRun={handleSaveHasRun}
                        setHandleSaveHasRun={setHandleSaveHasRun}
                        isCustomFieldRequired={false}
                      />
                      {/* Logic to disable this block on all select */}
                      <Box>
                        <Box sx={{ mt: 1.5, position: 'relative' }}>
                          <WeekCalender
                            showDetailsHandle={showDetailsHandle}
                            data={percentageAttendanceData}
                            disableDays={classId === 'all' ? true : false}
                            classId={classId}
                          />
                        </Box>
                        <Box
                          height={'auto'}
                          width={'auto'}
                          padding={'1rem'}
                          borderRadius={'1rem'}
                          bgcolor={'#4A4640'}
                          textAlign={'left'}
                          margin={'15px 0 15px 0 '}
                          sx={{ opacity: classId === 'all' ? 0.5 : 1 }}
                        >
                          <Stack
                            direction="row"
                            spacing={1}
                            // marginTop={1}
                            justifyContent={'space-between'}
                            alignItems={'center'}
                          >
                            <Box
                              display={'flex'}
                              gap={'5px'}
                              alignItems={'center'}
                              className="joyride-step-3"
                            >
                              {currentAttendance !== 'notMarked' &&
                                currentAttendance !== 'futureDate' && (
                                  <>
                                    <CircularProgressbar
                                      value={
                                        currentAttendance?.present_percentage
                                      }
                                      background
                                      backgroundPadding={8}
                                      styles={buildStyles({
                                        textColor: pathColor,
                                        pathColor: pathColor,
                                        trailColor: '#E6E6E6',
                                        strokeLinecap: 'round',
                                        backgroundColor: '#ffffff',
                                      })}
                                      className="fs-24 htw-24"
                                      strokeWidth={20}
                                    />
                                    <Box>
                                      <Typography
                                        // sx={{ color: theme.palette.warning['A400'] }}
                                        sx={{
                                          fontSize: '12px',
                                          fontWeight: '600',
                                          color: '#F4F4F4',
                                        }}
                                        variant="h6"
                                        className="word-break"
                                      >
                                        {t('DASHBOARD.PERCENT_ATTENDANCE', {
                                          percent_students:
                                            currentAttendance?.present_percentage,
                                        })}
                                      </Typography>
                                      <Typography
                                        // sx={{ color: theme.palette.warning['A400'] }}
                                        sx={{
                                          fontSize: '12px',
                                          fontWeight: '600',
                                          color: '#F4F4F4',
                                        }}
                                        variant="h6"
                                        className="word-break"
                                      >
                                        {t('DASHBOARD.PRESENT_STUDENTS', {
                                          present_students:
                                            currentAttendance?.present_students,
                                          total_students:
                                            currentAttendance?.totalcount,
                                        })}
                                      </Typography>
                                    </Box>
                                  </>
                                )}
                              {currentAttendance === 'notMarked' &&
                                currentAttendance !== 'futureDate' && (
                                  <Typography
                                    sx={{
                                      color: theme.palette.warning['A400'],
                                    }}
                                    fontSize={'0.8rem'}
                                    // variant="h6"
                                    // className="word-break"
                                  >
                                    {t('DASHBOARD.NOT_MARKED')}
                                  </Typography>
                                )}
                              {currentAttendance === 'futureDate' && (
                                <Typography
                                  sx={{ color: theme.palette.warning['A400'] }}
                                  fontSize={'0.8rem'}
                                  fontStyle={'italic'}
                                  fontWeight={'500'}
                                >
                                  {t('DASHBOARD.FUTURE_DATE_CANT_MARK')}
                                </Typography>
                              )}
                            </Box>
                            <Button
                              className="joyride-step-4 btn-mark-width"
                              variant="contained"
                              color="primary"
                              sx={{
                                '&.Mui-disabled': {
                                  backgroundColor:
                                    theme?.palette?.primary?.main, // Custom disabled text color
                                },
                                minWidth: '84px',
                                height: '2.5rem',
                                padding: theme.spacing(1),
                                fontWeight: '500',
                                '@media (min-width: 500px)': {
                                  width: '20%',
                                },
                                '@media (min-width: 700px)': {
                                  width: '15%',
                                },
                              }}
                              onClick={handleModalToggle}
                              disabled={
                                currentAttendance === 'futureDate' ||
                                classId === 'all' ||
                                formattedSevenDaysAgo > selectedDate
                              }
                            >
                              {currentAttendance === 'notMarked' ||
                              currentAttendance === 'futureDate'
                                ? t('COMMON.MARK')
                                : t('COMMON.MODIFY')}
                            </Button>
                          </Stack>
                        </Box>
                        {open && (
                          <MarkBulkAttendance
                            open={open}
                            onClose={handleClose}
                            classId={classId}
                            selectedDate={new Date(selectedDate)}
                            onSaveSuccess={(isModified) => {
                              if (isModified) {
                                showToastMessage(
                                  t(
                                    'ATTENDANCE.ATTENDANCE_MODIFIED_SUCCESSFULLY'
                                  ),
                                  'success'
                                );
                              } else {
                                showToastMessage(
                                  t(
                                    'ATTENDANCE.ATTENDANCE_MARKED_SUCCESSFULLY'
                                  ),
                                  'success'
                                );
                              }
                              setHandleSaveHasRun(!handleSaveHasRun);
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ padding: '0 20px' }}>
                      <Divider sx={{ borderBottomWidth: '0.1rem' }} />
                    </Box>

                    {/* Overview Card Section */}
                    <Box
                      display={'flex'}
                      flexDirection={'column'}
                      gap={'1rem'}
                      padding={'1rem 1.2rem'}
                    >
                      <Stack
                        direction={'row'}
                        justifyContent={'space-between'}
                        alignItems={'center'}
                        padding={'2px'}
                      >
                        <Box width="100%">
                          <Box
                            display={'flex'}
                            justifyContent={'space-between'}
                            alignItems={'center'}
                            width="100%"
                          >
                            <Typography
                              variant="h2"
                              sx={{
                                color: '#1F1B13',
                                fontSize: '14px',
                                fontWeight: '500',
                              }}
                            >
                              {t('DASHBOARD.OVERVIEW')}
                            </Typography>
                            <Box
                              display={'flex'}
                              justifyContent={'center'}
                              alignItems={'center'}
                              sx={{ color: theme.palette.secondary.main }}
                            >
                              <Link
                                className="flex-center fs-14 text-decoration"
                                href={'/attendance-overview'}
                                style={{
                                  color: theme.palette.secondary.main,
                                  fontWeight: '500',
                                }}
                                onClick={handleMoreDetailsClicked}
                              >
                                {t('DASHBOARD.MORE_DETAILS')}
                                <ArrowForwardSharpIcon
                                  sx={{ height: '18px' }}
                                />
                              </Link>
                            </Box>
                          </Box>
                          <Typography
                            sx={{
                              color: '#7C766F',
                              fontSize: '12px !important',
                              fontWeight: '500',
                            }}
                            variant="h2"
                          >
                            {t('DASHBOARD.LAST_SEVEN_DAYS_RANGE', {
                              date_range: dateRange,
                            })}
                          </Typography>
                        </Box>
                      </Stack>
                      {loading && (
                        <Loader
                          showBackdrop={true}
                          loadingText={t('COMMON.LOADING')}
                        />
                      )}
                    </Box>
                    <Box
                      display={'flex'}
                      className="card_overview"
                      mx={'1.2rem'}
                    >
                      {classId &&
                      classId !== 'all' &&
                      cohortsData &&
                      lowAttendanceLearnerList ? (
                        <Grid container spacing={2}>
                          <Grid item xs={4} className={'joyride-step-5'}>
                            <OverviewCard
                              label={t('ATTENDANCE.CENTER_ATTENDANCE')}
                              value={
                                cohortPresentPercentage === t('ATTENDANCE.N/A')
                                  ? cohortPresentPercentage
                                  : `${cohortPresentPercentage} %`
                              }
                            />
                          </Grid>
                          <Grid item xs={8} className={'joyride-step-6'}>
                            <OverviewCard
                              label={t('ATTENDANCE.LOW_ATTENDANCE_STUDENTS')}
                              {...(loading && (
                                <Loader
                                  loadingText={t('COMMON.LOADING')}
                                  showBackdrop={false}
                                />
                              ))}
                              valuePartOne={
                                Array.isArray(lowAttendanceLearnerList) &&
                                lowAttendanceLearnerList.length > 2
                                  ? `${lowAttendanceLearnerList[0]}, ${lowAttendanceLearnerList[1]}`
                                  : lowAttendanceLearnerList.length === 2
                                    ? `${lowAttendanceLearnerList[0]}, ${lowAttendanceLearnerList[1]}`
                                    : lowAttendanceLearnerList.length === 1
                                      ? `${lowAttendanceLearnerList[0]}`
                                      : Array.isArray(
                                            lowAttendanceLearnerList
                                          ) &&
                                          lowAttendanceLearnerList.length === 0
                                        ? t(
                                            'ATTENDANCE.NO_LEARNER_WITH_LOW_ATTENDANCE'
                                          )
                                        : t('ATTENDANCE.N/A')
                              }
                              valuePartTwo={
                                Array.isArray(lowAttendanceLearnerList) &&
                                lowAttendanceLearnerList.length > 2
                                  ? `${t('COMMON.AND')} ${lowAttendanceLearnerList.length - 2} ${t('COMMON.MORE')}`
                                  : null
                              }
                            />
                          </Grid>
                        </Grid>
                      ) : (
                        <Grid container spacing={2}>
                          {allCenterAttendanceData.map(
                            (item: {
                              cohortId: React.Key | null | undefined;
                              name: string;
                              presentPercentage: number;
                            }) => (
                              <Grid item xs={6} key={item.cohortId}>
                                <OverviewCard
                                  label={item.name}
                                  value={`${item.presentPercentage} %`}
                                />
                              </Grid>
                            )
                          )}
                        </Grid>
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* <Box sx={{ background: '#fff' }}>
            <Typography
              textAlign={'left'}
              fontSize={'0.8rem'}
              pl={'1rem'}
              pt={'1rem'}
              color={'black'}
              fontWeight={'600'}
            >
              {t('DASHBOARD.MY_TIMETABLE')}
            </Typography>
            <WeekDays useAbbreviation={false} />
          </Box>
          <Box
            sx={{
              background: '#fff',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Box width={'100%'}>
              <TimeTableCard
                subject={'Science'}
                instructor={'Khapari Dharmu'}
                time={'10 am - 1 pm'}
              />
              <TimeTableCard
                subject={'Home Science'}
                instructor={'Khapari Dharmu'}
                time={'2 pm - 5 pm'}
              />
              <Typography
                textAlign={'left'}
                fontSize={'0.8rem'}
                ml={'1rem'}
                color={'black'}
                fontWeight={'600'}
              >
                {t('DASHBOARD.UPCOMING_EXTRA_SESSION')}
              </Typography>
              <ExtraSessionsCard
                subject={'Science'}
                instructor={'Upendra Kulkarni'}
                dateAndTime={'27 May, 11am - 12pm'}
                meetingURL={
                  'https://meet.google.com/fqz-ftoh-dynfqz-ftoh-dynfqz-ftoh-dyn'
                }
                onEditClick={() => {
                  console.log('edit');
                }}
              />
            </Box>
          </Box> */}
              </Box>
            )}
          </>
        </>
      )}
    </>
  );
};

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      // Will be passed to the page component as props
    },
  };
}

export default Dashboard;
