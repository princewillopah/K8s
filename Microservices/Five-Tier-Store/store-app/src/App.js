import {
  Container,
  Text,
  Divider,
  Box,
  Image,
  Button,
  SimpleGrid,
  Flex,
} from "@chakra-ui/react";
import { FiShoppingCart } from "react-icons/fi";
import { useEffect, useState } from "react";
import Checkout from "./Checkout";
import axios from "axios";

function App() {
  const [products, setProducts] = useState([
    {
      name: "Chocolate Fudge",
      image:
        "https://www.rebootwithjoe.com/wp-content/uploads/2013/06/Almond-Butter-Chocolate-Fudge.jpg",
      description: "Gooey and creamy chocolate",
      price: 14.33,
    },
  ]);
  const [order, setOrder] = useState([]);

  const addToOrder = (product) => {
    const updatedOrder = [...order];
    const index = updatedOrder.findIndex((item) => item.product === product);
    if (index === -1) updatedOrder.push({ product, quantity: 1 });
    else updatedOrder[index].quantity = updatedOrder[index].quantity + 1;
    setOrder(updatedOrder);
  };

  const fetchProducts = async () => {
    try {
      const p = await axios.get("/api/products");
      setProducts(p.data.products);
    } catch (error) {}
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <Container maxW="container.xl" h="100vh">
      <Flex justifyContent="space-between" alignContent="center">
        <Text
          as="a"
          href="/"
          fontSize="2rem"
          color="gray.900"
          fontFamily="Robo"
          my="5px"
        >
          Golden Bakery
        </Text>

        <Checkout order={order} />
      </Flex>
      <Divider />
      <Box mt={4}>
        <SimpleGrid
          minChildWidth="300px"
          align="center"
          justify="center"
          spacing="40px"
          mb={32}
        >
          {products.map((product) => (
            <Box
              bg="white"
              maxW="sm"
              borderWidth="1px"
              rounded="lg"
              shadow="lg"
              _hover={{ shadow: "dark-lg" }}
              key={product.id}
            >
              <Image
                h="350px"
                fit="cover"
                src={product.image}
                alt={`Picture of ${product.name}`}
                roundedTop="lg"
              />

              <Box p="6">
                <Flex
                  mt="1"
                  justifyContent="space-between"
                  alignContent="center"
                >
                  <Text
                    fontSize="2xl"
                    fontWeight="semibold"
                    as="h4"
                    textTransform="uppercase"
                    lineHeight="tight"
                    fontFamily="Roboto"
                  >
                    {product.name}
                  </Text>
                  <Text
                    as="h4"
                    fontSize="2xl"
                    fontWeight="bold"
                    color="teal.600"
                  >
                    ${product.price}
                  </Text>
                </Flex>

                <Text
                  mt={2}
                  color="gray.500"
                  display={{ base: "none", md: "flex" }}
                >
                  {product.description}
                </Text>

                <Button
                  leftIcon={<FiShoppingCart size="24px" />}
                  size="lg"
                  mt={4}
                  isFullWidth
                  colorScheme="blue"
                  variant="outline"
                  alignSelf={"center"}
                  data-item-id={product.id}
                  data-item-image={product.image}
                  data-item-name={product.name}
                  data-item-url="/"
                  data-item-description={product.description}
                  data-item-price={product.price}
                  onClick={() => addToOrder(product.name)}
                >
                  Add to Cart
                </Button>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    </Container>
  );
}

export default App;
