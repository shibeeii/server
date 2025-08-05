const Address = require("../Models/AddressModel");

// ➕ Add Address
exports.AddAddress = async (req, res) => {
  const { userId, fullName, phone, addressLine, city, state, pincode } = req.body;

  try {
    const newAddress = await Address.create({
      userId,
      fullName,
      phone,
      addressLine,
      city,
      state,
      pincode
    });

    res.status(201).json(newAddress);
  } catch (err) {
    console.error("Add address error:", err);
    res.status(500).json({ error: "Failed to add address" });
  }
};

// 📝 Edit Address
exports.EditAddress = async (req, res) => {
  const { userId, addressId } = req.params;
  const updatedData = req.body;

  try {
    const updatedAddress = await Address.findOneAndUpdate(
      { _id: addressId, userId },
      updatedData,
      { new: true }
    );

    if (!updatedAddress) {
      return res.status(404).json({ error: "Address not found" });
    }

    res.json(updatedAddress);
  } catch (err) {
    console.error("Edit address error:", err);
    res.status(500).json({ error: "Failed to update address" });
  }
};

// ❌ Delete Address
exports.DeleteAddress = async (req, res) => {
  const { userId, addressId } = req.params;

  try {
    const deleted = await Address.findOneAndDelete({
      _id: addressId,
      userId
    });

    if (!deleted) {
      return res.status(404).json({ error: "Address not found" });
    }

    res.json({ message: "Address deleted successfully" });
  } catch (err) {
    console.error("Delete address error:", err);
    res.status(500).json({ error: "Failed to delete address" });
  }
};

// 📦 Get All Addresses
exports.GetAllAddress = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.params.userId });
    res.json(addresses);
  } catch (err) {
    console.error("Get addresses error:", err);
    res.status(500).json({ error: "Failed to fetch addresses" });
  }
};
