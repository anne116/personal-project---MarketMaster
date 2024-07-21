import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Divider,
  useColorModeValue,
  useTheme,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { Bar, Pie, Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartDataLabels,
  PointElement,
);

const Analysis = () => {
  const theme = useTheme();
  const location = useLocation();
  const { keyword } = location.state || {};
  const [suggestedTitle, setSuggestedTitle] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (keyword) {
      fetchStatistics();
      fetchSuggestedTitle();
    }
  }, [keyword]);

  const fetchStatistics = async () => {
    try {
      const response = await fetch(
        `/api/fetch_statistics?keyword=${encodeURIComponent(keyword)}`,
      );
      if (!response.ok) throw new Error("Failed to fetch statistics");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchSuggestedTitle = async () => {
    try {
      const titleResponse = await fetch(
        `/api/suggested_title?keyword=${encodeURIComponent(keyword)}`,
      );
      if (!titleResponse.ok) throw new Error("Failed to fetch suggested title");
      const suggested_title = await titleResponse.json();
      setSuggestedTitle(suggested_title);
    } catch (err) {
      setError(err.message);
    }
  };

  const calculateBins = (data, numBins = 10) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const step = Math.ceil((max - min) / numBins);
    let bins = [];
    for (let i = 0; i <= numBins; i++) {
      bins.push(min + i * step);
    }
    return bins;
  };

  const createBinLabels = (bins) => {
    let labels = [];
    for (let i = 0; i < bins.length - 1; i++) {
      labels.push(`${Math.floor(bins[i])}-${Math.floor(bins[i + 1])}`);
    }
    return labels;
  };

  const priceBins = stats ? calculateBins(stats.price_list) : [];
  const reviewBins = stats ? calculateBins(stats.review_list) : [];

  const chartHeight = 400;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 14,
            family: "Oswald, sans-serif",
          },
          color: theme.colors.brand[50],
        },
      },
      title: {
        display: true,
        font: {
          size: 16,
          family: "Oswald, sans-serif",
        },
        color: theme.colors.brand[50],
      },
      datalabels: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 14,
            family: "Oswald, sans-serif",
          },
          color: theme.colors.brand[50],
        },
      },
      y: {
        ticks: {
          font: {
            size: 14,
            family: "Oswald, sans-serif",
          },
          color: theme.colors.brand[50],
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "50%",
    plugins: {
      legend: {
        position: "right",
        labels: {
          font: {
            size: 14,
            family: "Oswald, sans-serif",
          },
          color: theme.colors.brand[50],
        },
      },
      title: {
        display: true,
        text: "Product Distribution By Rating",
        font: {
          size: 16,
          family: "Oswald, sans-serif",
        },
        color: theme.colors.brand[50],
      },
      datalabels: {
        formatter: (value, context) => {
          // eslint-disable-next-line no-underscore-dangle
          const total = context.chart._metasets[0].total;
          const percentage = ((value / total) * 100).toFixed(2) + "%";
          return percentage;
        },
        color: theme.colors.brand[50],
        font: {
          size: 14,
          family: "Oswald, sans-serif",
        },
        align: "end",
        anchor: "end",
        offset: -10,
      },
    },
  };

  const scatterChartOptions = (title, yLabel) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 14,
            family: "Oswald, sans-serif",
          },
          color: theme.colors.brand[50],
        },
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          family: "Oswald, sans-serif",
        },
        color: theme.colors.brand[50],
      },
      datalabels: {
        display: false,
      },
    },
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        title: {
          display: true,
          text: "Price ($)",
          font: {
            size: 14,
            family: "Oswald, sans-serif",
          },
          color: theme.colors.brand[50],
        },
        ticks: {
          font: {
            size: 14,
            family: "Oswald, sans-serif",
          },
          color: theme.colors.brand[50],
        },
      },
      y: {
        title: {
          display: true,
          text: yLabel,
          font: {
            size: 14,
            family: "Oswald, sans-serif",
          },
          color: theme.colors.brand[50],
        },
        ticks: {
          font: {
            size: 14,
            family: "Oswald, sans-serif",
          },
          color: theme.colors.brand[50],
        },
      },
    },
  });

  const priceRangeData = {
    labels: stats ? createBinLabels(priceBins) : [],
    datasets: [
      {
        label: "Number of Products",
        data: stats ? Object.values(stats.price_range_distribution) : [],
        backgroundColor: theme.colors.brand[300],
        borderColor: theme.colors.brand[600],
        borderWidth: 1,
      },
    ],
  };

  const ratingDistributionData = {
    labels: ["1-Star", "2-Star", "3-Star", "4-Star", "5-Star"],
    datasets: [
      {
        label: "Rating Distribution",
        data: stats
          ? [
              stats.rating_distribution["1"],
              stats.rating_distribution["2"],
              stats.rating_distribution["3"],
              stats.rating_distribution["4"],
              stats.rating_distribution["5"],
            ]
          : [],
        backgroundColor: theme.colors.brand[400],
        borderColor: theme.colors.brand[700],
        borderWidth: 1,
      },
    ],
  };

  const reviewRangeData = {
    labels: stats ? createBinLabels(reviewBins) : [],
    datasets: [
      {
        label: "Number of Products",
        data: stats ? Object.values(stats.review_range_distribution) : [],
        backgroundColor: theme.colors.brand[200],
        borderColor: theme.colors.brand[600],
        borderWidth: 1,
      },
    ],
  };

  const productDistributionByRatingData = {
    labels: ["1 Star", "2 Star", "3 Star", "4 Star", "5 Star"],
    datasets: [
      {
        data: stats
          ? [
              stats.rating_distribution["1"],
              stats.rating_distribution["2"],
              stats.rating_distribution["3"],
              stats.rating_distribution["4"],
              stats.rating_distribution["5"],
            ]
          : [],
        backgroundColor: [
          theme.colors.brand[50],
          theme.colors.brand[400],
          theme.colors.brand[350],
          theme.colors.brand[100],
          theme.colors.brand[550],
        ],
        borderColor: [
          theme.colors.brand[650],
          theme.colors.brand[700],
          theme.colors.brand[750],
          theme.colors.brand[850],
          theme.colors.brand[950],
        ],
        borderWidth: 1,
      },
    ],
  };

  const priceVsReviewsData = {
    datasets: [
      {
        label: "Price vs Reviews",
        data:
          stats && stats.price_list && stats.rating_list
            ? stats.price_list.map((price, index) => ({
                x: price,
                y: stats.review_list[index],
              }))
            : [],
        backgroundColor: theme.colors.brand[300],
        borderColor: theme.colors.brand[600],
      },
    ],
  };

  const priceVsRatingData = {
    datasets: [
      {
        label: "Price vs Rating",
        data:
          stats && stats.price_list && stats.rating_list
            ? stats.price_list.map((price, index) => ({
                x: price,
                y: stats.rating_list[index],
              }))
            : [],
        backgroundColor: theme.colors.brand[400],
        borderColor: theme.colors.brand[700],
      },
    ],
  };

  return (
    <Box p={5} bg={useColorModeValue("gray.50", "gray.800")} minH="100vh">
      <Box maxW="1200px" mx="auto">
        <Heading as="h1" size="xl" mb={6} textAlign="center" color="brand.800">
          Product Analysis for {keyword}
        </Heading>
        {error && (
          <Text color="red.500" mb={4}>
            {error}
          </Text>
        )}
        {stats ? (
          <VStack spacing={4} align="stretch">
            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <GridItem>
                <Box p={4} bg="white" boxShadow="md" borderRadius="md">
                  <Heading as="h2" size="lg" mb={4} color="brand.500">
                    Analysis Metrics
                  </Heading>
                  <Text fontSize="lg">
                    Estimated Seller Count: {stats.seller_count}
                  </Text>
                  <Text mt={3} fontSize="lg">
                    Price Range: ${stats.price_range[0]} - $
                    {stats.price_range[1]}
                  </Text>
                  <Text mt={3} fontSize="lg">
                    Average Price: ${stats.average_price.toFixed(2)}
                  </Text>
                  <Text mt={3} fontSize="lg">
                    Average Rating: {stats.average_rating.toFixed(2)}
                  </Text>
                  <Text mt={3} fontSize="lg">
                    Average Review: {stats.average_reviews.toFixed(0)}
                  </Text>
                </Box>
              </GridItem>

              <GridItem>
                <Box p={4} bg="white" boxShadow="md" borderRadius="md">
                  <Heading as="h2" size="lg" mb={4} color="brand.500">
                    Suggested Product Title
                  </Heading>
                  {suggestedTitle && (
                    <div>
                      <p>{suggestedTitle}</p>
                    </div>
                  )}
                </Box>
              </GridItem>
            </Grid>

            <Divider />

            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <GridItem>
                <Box
                  p={4}
                  bg={theme.colors.brand[700]}
                  boxShadow="md"
                  borderRadius="md"
                  height={`${chartHeight}px`}
                >
                  <Bar
                    data={priceRangeData}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          ...chartOptions.plugins.title,
                          text: "Price Range Distribution ($US)",
                        },
                      },
                    }}
                  />
                </Box>
              </GridItem>
              <GridItem>
                <Box
                  p={4}
                  bg={theme.colors.brand[700]}
                  boxShadow="md"
                  borderRadius="md"
                  height={`${chartHeight}px`}
                >
                  <Bar
                    data={ratingDistributionData}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          ...chartOptions.plugins.title,
                          text: "Rating Distribution",
                        },
                      },
                    }}
                  />
                </Box>
              </GridItem>
            </Grid>

            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <GridItem>
                <Box
                  p={4}
                  bg={theme.colors.brand[700]}
                  boxShadow="md"
                  borderRadius="md"
                  height={`${chartHeight}px`}
                >
                  <Bar
                    data={reviewRangeData}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          ...chartOptions.plugins.title,
                          text: "Review Distribution",
                        },
                      },
                    }}
                  />
                </Box>
              </GridItem>
              <GridItem>
                <Box
                  p={4}
                  bg={theme.colors.brand[700]}
                  boxShadow="md"
                  borderRadius="md"
                  height={`${chartHeight}px`}
                >
                  <Pie
                    data={productDistributionByRatingData}
                    options={{
                      ...pieChartOptions,
                      plugins: {
                        ...pieChartOptions.plugins,
                        title: {
                          ...chartOptions.plugins.title,
                          text: "Product Distribution By Rating",
                        },
                      },
                    }}
                  />
                </Box>
              </GridItem>
            </Grid>

            <Divider />

            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <GridItem>
                <Box
                  p={4}
                  bg={theme.colors.brand[700]}
                  boxShadow="md"
                  borderRadius="md"
                  height={`${chartHeight}px`}
                >
                  <Scatter
                    data={priceVsReviewsData}
                    options={scatterChartOptions(
                      "Price vs Reviews",
                      "Number of Reviews",
                    )}
                  />
                </Box>
              </GridItem>
              <GridItem>
                <Box
                  p={4}
                  bg={theme.colors.brand[700]}
                  boxShadow="md"
                  borderRadius="md"
                  height={`${chartHeight}px`}
                >
                  <Scatter
                    data={priceVsRatingData}
                    options={scatterChartOptions("Price vs Rating", "Rating")}
                  />
                </Box>
              </GridItem>
            </Grid>
          </VStack>
        ) : (
          <Box display="flex" justifyContent="center" mt={4}>
            <Spinner size="xl" />
            <Text ml={2}>Loading...</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Analysis;
