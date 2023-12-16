import { Button } from "@chakra-ui/button";
import { ListItem, UnorderedList, Input } from "@chakra-ui/react";
import React from "react";
import { FiShoppingBag } from "react-icons/fi";
import Modal from "react-modal";
import axios from "axios";

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
  },
};

export default function Checkout({ order }) {
  let subtitle;
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [modalIsOpen, setIsOpen] = React.useState(false);

  function openModal() {
    setIsOpen(true);
  }

  function afterOpenModal() {
    subtitle.style.color = "#f00";
  }

  function closeModal() {
    setIsOpen(false);
  }

  const placeOrder = async () => {
    if (address && phone && order.length) {
      try {
        const order = await axios.post("/api/orders", {
          order,
          phone,
          address,
        });
        setIsOpen(false);
      } catch (error) {}
    }
  };

  return (
    <div>
      <Button
        my="5px"
        colorScheme="green"
        variant="ghost"
        leftIcon={<FiShoppingBag size="24px" />}
        size="lg"
        p={2}
        onClick={openModal}
      >
        View Cart
      </Button>
      <Modal
        isOpen={modalIsOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Example Modal"
      >
        <UnorderedList>
          {order.map((item) => (
            <ListItem>
              {item.product} x {item.quantity}
            </ListItem>
          ))}
        </UnorderedList>
        <Input
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Input
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <Button onClick={placeOrder}>Place Order</Button>
      </Modal>
    </div>
  );
}
