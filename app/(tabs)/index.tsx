import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* <Link href="/notifications">visit notifications
      </Link> */}
      <Text>home</Text>
    </View>
  );
}
