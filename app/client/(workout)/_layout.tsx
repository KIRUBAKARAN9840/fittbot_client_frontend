import { Stack } from "expo-router";
import React from "react";

export default function workoutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="personalTemplate"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="addExerciseTemplate"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="AddExerciseToTemplate"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="fittbotWorkoutPage"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="homeWorkoutPage"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="gymTemplate"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="kyraAI"
        options={{ headerShown: false, gestureEnabled: false }}
      />
        </Stack>
  );
}
