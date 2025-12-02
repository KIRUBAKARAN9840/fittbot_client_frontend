import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Modal,
  ActivityIndicator,
  ScrollView,
  BackHandler,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput } from "react-native";
import { debounce } from "lodash";
import {
  addClientDietAPI,
  getAllFoodsAPI,
  getFoodCategoriesAPI,
  getFoodsByCategoryAPI,
  searchAllFoodsAPI,
} from "../../../services/clientApi";
import AnimatedPlaceholder from "../../../components/ui/AnimatedPlaceholder";
import FoodCard from "../../../components/ui/Diet/FoodCard";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import GradientOutlineButton from "../../../components/ui/GradientOutlineButton";
import { showToast } from "../../../utils/Toaster";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GradientButton from "../../../components/ui/GradientButton";
import { format } from "date-fns";
import GrainConfettiAnimation from "../../../components/ui/ConfettiAnimation";
import HardwareBackHandler from "../../../components/HardwareBackHandler";
const { width } = Dimensions.get("window");
const ITEMS_PER_PAGE = 10;

const GymAppScreen = () => {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isCategoryMode, setIsCategoryMode] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const [categorySearchText, setCategorySearchText] = useState("");
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [tempSelectedCategories, setTempSelectedCategories] = useState([]);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [selectedFoodsSet, setSelectedFoodsSet] = useState(new Set());
  const [xpRewardVisible, setXpRewardVisible] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);

  useEffect(() => {
    fetchFoods(1, true);
    fetchCategories();
  }, []);

  const fetchFoods = async (pageNum, isInitialLoad = false) => {
    if (!hasMoreData && pageNum > 1) return;
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await getAllFoodsAPI(pageNum, ITEMS_PER_PAGE);
      if (response?.status === 200) {
        if (response?.data && response?.data.length > 0) {
          if (pageNum === 1) {
            setFoods(response.data);
            setFilteredFoods(response.data);
          } else {
            setFoods((prevFoods) => [...prevFoods, ...response.data]);
            setFilteredFoods((prevFoods) => [...prevFoods, ...response.data]);
          }
          setHasMoreData(response.data.length === ITEMS_PER_PAGE);
        } else {
          setHasMoreData(false);
        }
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.detail || "Something went wrong. Please try again later",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Error fetching foods. Please try again later",
      });
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getFoodCategoriesAPI();
      if (response?.status === 200) {
        setCategories(response?.data);
        setFilteredCategories(response?.data);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: "Error getting categories",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };

  const searchFoodsAPI = async (
    query,
    categories,
    pageNum = 1,
    loadMore = false
  ) => {
    if (!loadMore) {
      setSearchLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      if (query.length < 3 && categories.length === 0) {
        setIsSearchMode(false);
        setIsCategoryMode(false);
        setFilteredFoods(foods);
        setSearchLoading(false);
        setIsLoadingMore(false);
        return;
      }

      setIsSearchMode(true);
      const response = await searchAllFoodsAPI(query, pageNum, ITEMS_PER_PAGE);

      if (response && response.status === 200) {
        const searchResults = response.data;

        let filtered = searchResults;
        if (categories.length > 0) {
          filtered = searchResults.filter((food) =>
            categories.includes(food.categories)
          );
        }

        if (pageNum === 1) {
          setFilteredFoods(filtered);
        } else {
          setFilteredFoods((prevFoods) => [...prevFoods, ...filtered]);
        }

        setHasMoreData(searchResults.length === ITEMS_PER_PAGE);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Error searching foods",
        });

        applyLocalFilters(query, categories);
        setHasMoreData(false);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Error searching foods",
      });
      applyLocalFilters(query, categories);
      setHasMoreData(false);
    } finally {
      setSearchLoading(false);
      setIsLoadingMore(false);
    }
  };

  const fetchFoodsByCategory = async (
    categories,
    pageNum = 1,
    loadMore = false
  ) => {
    if (!loadMore) {
      setSearchLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      setIsCategoryMode(true);

      if (searchText.length >= 3) {
        setIsSearchMode(true);
        searchFoodsAPI(searchText, categories, pageNum, loadMore);
        return;
      }

      const response = await getFoodsByCategoryAPI(
        categories,
        pageNum,
        ITEMS_PER_PAGE
      );

      if (response && response.status === 200) {
        const categoryResults = response.data;

        if (pageNum === 1) {
          setFilteredFoods(categoryResults);
        } else {
          setFilteredFoods((prevFoods) => [...prevFoods, ...categoryResults]);
        }

        setHasMoreData(categoryResults.length === ITEMS_PER_PAGE);
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc: response?.detail || "Error filtering foods",
        });
        applyLocalFilters("", categories);
        setHasMoreData(false);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Error filtering foods by category",
      });
      applyLocalFilters("", categories);
      setHasMoreData(false);
    } finally {
      setSearchLoading(false);
      setIsLoadingMore(false);
    }
  };

  const applyLocalFilters = (searchQuery, categories) => {
    let result = foods;

    if (searchQuery && searchQuery.length >= 3) {
      result = result.filter((food) =>
        food.item.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categories.length > 0) {
      result = result.filter((food) => categories.includes(food.categories));
    }

    setFilteredFoods(result);
  };

  const filterCategories = (text) => {
    setCategorySearchText(text);
    if (text) {
      const filtered = categories.filter((category) =>
        category.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  };

  const debouncedSearch = useCallback(
    debounce((text, categories) => {
      setSearchPage(1);
      setCategoryPage(1);

      if (text.length >= 3) {
        setIsSearchMode(true);
        setIsCategoryMode(categories.length > 0);
        searchFoodsAPI(text, categories, 1);
      } else if (categories.length > 0) {
        setIsSearchMode(false);
        setIsCategoryMode(true);
        fetchFoodsByCategory(categories, 1);
      } else {
        setIsSearchMode(false);
        setIsCategoryMode(false);
        setPage(1);
        fetchFoods(1, true);
      }
    }, 500),
    []
  );

  const handleSearch = (text) => {
    setSearchText(text);
    debouncedSearch(text, selectedCategories);
  };

  const toggleCategoryFilter = (category) => {
    setTempSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((cat) => cat !== category)
        : [...prev, category]
    );
  };

  const applyFilters = () => {
    setSelectedCategories(tempSelectedCategories);
    setCategoryPage(1);
    setSearchPage(1);

    if (tempSelectedCategories.length > 0) {
      if (searchText.length >= 3) {
        searchFoodsAPI(searchText, tempSelectedCategories, 1);
      } else {
        fetchFoodsByCategory(tempSelectedCategories, 1);
      }
    } else if (searchText.length >= 3) {
      searchFoodsAPI(searchText, [], 1);
    } else {
      resetFilters();
    }

    setIsFilterModalVisible(false);
  };

  const resetFilters = () => {
    setSearchText("");
    setSelectedCategories([]);
    setTempSelectedCategories([]);
    setIsSearchMode(false);
    setIsCategoryMode(false);
    setPage(1);
    setSearchPage(1);
    setCategoryPage(1);
    fetchFoods(1, true);
  };

  const resetTempFilters = () => {
    setTempSelectedCategories([]);
  };

  const loadMoreData = () => {
    if (loading || isLoadingMore || !hasMoreData) return;

    if (isSearchMode) {
      if (searchText.length >= 3) {
        const nextSearchPage = searchPage + 1;
        setSearchPage(nextSearchPage);
        searchFoodsAPI(searchText, selectedCategories, nextSearchPage, true);
      }
    } else if (isCategoryMode) {
      const nextCategoryPage = categoryPage + 1;
      setCategoryPage(nextCategoryPage);
      fetchFoodsByCategory(selectedCategories, nextCategoryPage, true);
    } else {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFoods(nextPage);
    }
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#FF5757" />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  const isVegetarian = (category) => {
    return (
      category &&
      (category.includes("Veg") ||
        !category.includes("Non-veg") ||
        category.includes("Vegetable") ||
        category.includes("Fruit"))
    );
  };

  const renderFoodItem = ({ item }) => {
    const vegStatus = isVegetarian(item.categories);

    return (
      <View style={styles.foodCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.foodName}>{item.item}</Text>
          <Text style={styles.categoryText}>{item.categories}</Text>
        </View>

        <View style={styles.cardContent}>
          <Image
            source={
              item.pic
                ? { uri: item.pic }
                : require("../../../assets/images/chicken.jpeg")
            }
            style={styles.foodImage}
          />

          <View style={styles.foodDetails}>
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientItem}>
                <Text style={styles.nutrientValue}>{item.protein}g</Text>
                <Text style={styles.nutrientLabel}>Protein</Text>
              </View>

              <View style={styles.nutrientItem}>
                <Text style={styles.nutrientValue}>{item.carbs}g</Text>
                <Text style={styles.nutrientLabel}>Carbs</Text>
              </View>

              <View style={styles.nutrientItem}>
                <Text style={styles.nutrientValue}>{item.fat}g</Text>
                <Text style={styles.nutrientLabel}>Fat</Text>
              </View>
              <View style={styles.nutrientItem}>
                <Text style={styles.nutrientValue}>{item.fiber}g</Text>
                <Text style={styles.nutrientLabel}>Fiber</Text>
              </View>
              <View style={styles.nutrientItem}>
                <Text style={styles.nutrientValue}>{item.sugar}g</Text>
                <Text style={styles.nutrientLabel}>Sugar</Text>
              </View>
            </View>

            <View style={styles.caloriesContainer}>
              <Ionicons name="flame-outline" size={16} color="#FF5757" />
              <Text style={styles.caloriesText}>
                {item.calories} kcal • {item.quantity}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };
  const renderCategoryChips = () => {
    return (
      <View style={styles.categoryChipsContainer}>
        {selectedCategories.map((category) => (
          <TouchableOpacity
            key={category}
            style={styles.selectedCategoryChip}
            onPress={() => {
              setTempSelectedCategories(
                selectedCategories.filter((cat) => cat !== category)
              );
              setIsFilterModalVisible(true);
            }}
          >
            <LinearGradient
              colors={
                // tempSelectedCategories.includes(category)
                // ?
                ["#28a746bc", "#007bffb1"]
                // : ['#F0F0F0', '#F0F0F0']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.selectedCategoryChip2}
            >
              <Text style={styles.selectedCategoryChipText}>{category}</Text>
              <Ionicons name="close-circle" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const openFilterModal = () => {
    setTempSelectedCategories([...selectedCategories]);
    setIsFilterModalVisible(true);
  };

  const renderFilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isFilterModalVisible}
      onRequestClose={() => setIsFilterModalVisible(false)}
    >
      <TouchableWithoutFeedback onPress={() => setIsFilterModalVisible(false)}>
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter by Category</Text>
                <TouchableOpacity
                  onPress={() => setIsFilterModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.categorySearchInput}
                placeholder="Search categories..."
                placeholderTextColor="#999"
                value={categorySearchText}
                onChangeText={filterCategories}
              />

              <ScrollView style={styles.categoryScrollView}>
                <View style={styles.filterModalButtonContainer}>
                  {(filteredCategories || []).map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.filterModalButton,
                        tempSelectedCategories.includes(category) &&
                          styles.selectedFilterModalButton,
                      ]}
                      onPress={() => toggleCategoryFilter(category)}
                    >
                      <LinearGradient
                        colors={
                          tempSelectedCategories.includes(category)
                            ? ["#28a746bc", "#007bffb1"]
                            : ["#F0F0F0", "#F0F0F0"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.filterModalButton2}
                      >
                        <Text
                          style={[
                            styles.filterModalButtonText,
                            tempSelectedCategories.includes(category) && {
                              color: "white",
                            },
                          ]}
                        >
                          {category}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.modalButtonContainer}>
                <GradientOutlineButton
                  title="Reset"
                  onPress={resetTempFilters}
                  colors={["#28A745", "#007BFF"]}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: "500",
                    backgroundColor: "pink",
                    textAlign: "center",
                    // flex: 1,
                  }}
                  textStyle={{
                    paddingHorizontal: 10,
                    // marginLeft: 20,
                    backgroundColor: "pink",
                  }}
                />

                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={applyFilters}
                >
                  <LinearGradient
                    style={styles.applyButton2}
                    // style={styles.filterButton}
                    colors={["#28A745", "#007BFF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.applyButtonText}>Apply Filters</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        router.push({
          pathname: "/client/diet",
          selectedTab: "+Add",
        });
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => {
        backHandler.remove();
      };
    }, [])
  );

  const toggleFoodSelection = useCallback((food) => {
    setSelectedFoods((prevSelectedFoods) => {
      const isSelected = selectedFoodsSet.has(food.id);

      if (isSelected) {
        setSelectedFoodsSet((prev) => {
          const newSet = new Set(prev);
          newSet.delete(food.id);
          return newSet;
        });
        return prevSelectedFoods.filter((f) => f.id !== food.id);
      } else {
        setSelectedFoodsSet((prev) => new Set(prev).add(food.id));
        return [...prevSelectedFoods, { ...food, quantity: "1" }];
      }
    });
  }, [selectedFoodsSet]);

  const updateFoodQuantity = useCallback((foodId, quantity) => {
    setSelectedFoods((prevFoods) =>
      prevFoods.map((food) =>
        food.id === foodId ? { ...food, quantity } : food
      )
    );
  }, []);

  const saveFoods = async () => {
    if (selectedFoods.length === 0) {
      showToast({
        type: "error",
        title: "No Food Selected",
      });
      return;
    }

    // Handle regular diet log
    try {
      const clientId = await AsyncStorage.getItem("client_id");
      const gymId = await AsyncStorage.getItem("gym_id");
      if (!clientId) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
        return;
      }

      const newFoods = (selectedFoods || []).map((food) => {
        const quantity = parseInt(food.quantity) || 1;
        return {
          ...food,
          id: `${food.id}-${Date.now()}-${Math.random()}`,
          quantity,
          calories: food.calories * quantity,
          protein: food.protein * quantity,
          carbs: food.carbs * quantity,
          fat: food.fat * quantity,
          fiber: food.fiber * quantity,
          sugar: food.sugar * quantity,
          date: format(new Date(), "yyyy-MM-dd"),
          timeAdded: format(new Date(), "HH:mm"),
          name: food.item,
          pic: food.pic,
        };
      });

      const payload = {
        client_id: clientId,
        date: format(new Date(), "yyyy-MM-dd"),
        diet_data: newFoods,
        gym_id: gymId ? gymId : null,
      };

      const response = await addClientDietAPI(payload);

      if (response?.status === 200) {
        const earnedXp = response?.reward_point || 0;
        if (earnedXp) {
          setXpAmount(earnedXp);
          setXpRewardVisible(true);
        }
        setSelectedFoods([]);
        if (!earnedXp) {
          showToast({
            type: "success",
            title: "Success",
            desc: "Diet Added Successfully.",
          });
          router.push({
            pathname: "/client/myListedFoodLogs",
          });

          setXpRewardVisible(false);
        } else {
          setTimeout(() => {
            router.push({
              pathname: "/client/myListedFoodLogs",
            });

            setXpRewardVisible(false);
          }, 3000);
        }

        return response;
      } else {
        showToast({
          type: "error",
          title: "Error",
          desc:
            response?.detail || "Something went wrong. Please try again later",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        desc: "Something went wrong. Please try again later",
      });
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <HardwareBackHandler routePath="/client/diet" enabled={true} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/client/diet")}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>

        <View
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingRight: 30,
          }}
        ></View>
      </View>

      <View style={styles.search_bar}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />

        <AnimatedPlaceholder
          style={styles.searchInput}
          value={searchText}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
        />

        <TouchableOpacity onPress={openFilterModal}>
          <LinearGradient
            style={styles.filterButton}
            colors={["#28A745", "#007BFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View>
              <Ionicons name="options-outline" size={20} color="#FFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {xpRewardVisible ? (
        <GrainConfettiAnimation numberOfPieces={150} xpPoints={xpAmount} />
      ) : (
        ""
      )}

      {selectedCategories.length > 0 && renderCategoryChips()}

      {(selectedCategories.length > 0 || searchText.length > 0) && (
        <TouchableOpacity style={styles.viewAllButton} onPress={resetFilters}>
          <Text style={styles.viewAllButtonText}>Reset Filters</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#FF5757" />
          <Text style={styles.loadingText}>Loading foods...</Text>
        </View>
      ) : searchLoading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#FF5757" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFoods}
          renderItem={({ item }) => (
            <FoodCard
              id={item.id}
              image={item.pic}
              title={item.item}
              calories={item.calories}
              carbs={item.carbs}
              fat={item.fat}
              protein={item.protein}
              sugar={item.sugar}
              fiber={item.fiber}
              quantity={item.quantity}
              showAddFoodButton
              viewAllFood
              isSelected={selectedFoodsSet.has(item.id)}
              onAdd={() => toggleFoodSelection(item)}
              updateFoodQuantity={updateFoodQuantity}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.foodListContainer}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="nutrition-outline" size={64} color="#DDD" />
              <Text style={styles.emptyText}>No foods found</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your search or filters
              </Text>
            </View>
          }
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
          removeClippedSubviews={true}
        />
      )}
      {selectedFoods.length > 0 ? (
        <>
          <View style={styles.selectedCountContainer}>
            <Text style={styles.selectedCountText}>
              {selectedFoods.length} item{selectedFoods.length !== 1 ? "s" : ""}{" "}
              selected
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <GradientButton
              title={"Add to Today's Food Log"}
              fromColor="#28A745"
              toColor="#007BFF"
              containerStyle={{ marginTop: 0 }}
              textStyle={{ fontSize: 12 }}
              onPress={saveFoods}
              disabled={loading || selectedFoods?.length === 0}
            />
          </View>
        </>
      ) : (
        ""
      )}

      {renderFilterModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    // marginTop: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 8,
    marginVertical: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    color: "#333",
  },
  filterButton: {
    backgroundColor: "#FF5757",
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  categoryChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  selectedCategoryChip: {
    backgroundColor: "#ffc9c9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
    // paddingVertical: 10,
    // paddingHorizontal: 16,
    // paddingRight: 12,
    // marginRight: 8,
  },
  selectedCategoryChip2: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 16,
    // paddingRight: 12,
    // marginRight: 8,
  },
  selectedCategoryChipText: {
    color: "#FFF",
    marginRight: 6,
    fontSize: 14,
    fontWeight: "600",
  },
  foodListContainer: {
    paddingHorizontal: 0,
    marginTop: 0,
  },
  foodCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  foodName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    paddingLeft: 5,
  },
  indicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  vegIndicator: {
    backgroundColor: "#4CAF50",
    borderColor: "#2E7D32",
  },
  nonVegIndicator: {
    backgroundColor: "#F44336",
    borderColor: "#C62828",
  },
  cardContent: {
    flexDirection: "row",
    padding: 12,
  },
  foodImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  foodDetails: {
    flex: 1,
    marginLeft: 12,
  },
  nutrientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  nutrientItem: {
    alignItems: "center",
    width: "30%",
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  nutrientLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  caloriesContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  caloriesText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  categoryChip: {
    backgroundColor: "#F0F0F0",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: 10,
    color: "#666",
  },
  viewAllButton: {
    alignSelf: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#6a6a6a",
  },
  viewAllButtonText: {
    color: "#6a6a6a",
    fontSize: 14,
    fontWeight: "500",
  },
  loaderContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  centerLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
    textAlign: "center",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "90%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  categorySearchInput: {
    backgroundColor: "#F7F7F7",
    borderRadius: 8,
    padding: 12,
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    fontSize: 14,
  },
  categoryScrollView: {
    maxHeight: 400,
  },
  filterModalButtonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    paddingTop: 0,
  },
  filterModalButton: {
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    // paddingVertical: 8,
    // paddingHorizontal: 12,
    margin: 4,
  },
  filterModalButton2: {
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    // margin: 4,
  },
  selectedFilterModalButton: {
    backgroundColor: "#FF5757",
  },
  filterModalButtonText: {
    fontSize: 12,
    color: "#666",
  },
  modalButtonContainer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: 10,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF5757",
    borderRadius: 8,
    marginRight: 8,
  },

  resetButtonText: {
    color: "#FF5757",
    fontWeight: "bold",
  },
  applyButton: {
    flex: 2,
    // paddingVertical: 12,
    // alignItems: 'center',
    borderRadius: 8,
  },
  applyButton2: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  applyButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  search_bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 5,
    marginBottom: 10,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 8,
    // paddingVertical: 4,
    fontSize: 10,
  },
  selectedCountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: "400",
  },
  buttonContainer: {
    marginBottom: 0,
  },
});

export default GymAppScreen;
