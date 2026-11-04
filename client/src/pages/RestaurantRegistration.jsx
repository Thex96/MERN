import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/useAuth";
import api from "../api/axios";
import "../css/RestaurantRegistration.css";

const initialFormData = {
  restaurantName: "",
  legalBusinessName: "",
  businessType: "",
  businessRegistrationNumber: "",
  ownerName: "",
  contactDesignation: "",
  email: "",
  phone: "",
  cuisine: "",
  address: "",
  landmark: "",
  postalCode: "",
  city: "",
  state: "",
  description: "",
  openingTime: "",
  closingTime: "",
  imageUrl: "",
};

const initialCompliance = {
  fssaiNumber: "",
  fssaiType: "",
  fssaiValidUntil: "",
  gstStatus: "",
  gstin: "",
  shopLicenseNumber: "",
};

const initialMenuItem = {
  category: "",
  name: "",
  description: "",
  price: "",
  imageUrl: "",
};

function formatDateForInput(date) {
  if (!date) return "";

  if (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(date)
  ) {
    return date.slice(0, 10);
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toISOString().slice(0, 10);
}

function getInitialFormData(application, userEmail) {
  if (!application) return { ...initialFormData, email: userEmail || "" };
  const fields = Object.keys(initialFormData).reduce((result, key) => {
    if (application[key] !== undefined) result[key] = application[key];
    return result;
  }, {});
  return {
    ...initialFormData,
    ...fields,
    email: application.email || userEmail || "",
  };
}

function getInitialCompliance(application) {
  return application ? {
    ...initialCompliance,
    ...(application.compliance || {}),
    fssaiValidUntil: formatDateForInput(application.compliance?.fssaiValidUntil),
  } : initialCompliance;
}

function getInitialMenu(application) {
  return Array.isArray(application?.menu) && application.menu.length > 0
    ? application.menu.map((item) => ({
        ...initialMenuItem,
        category: item.category || "",
        name: item.name || "",
        description: item.description || "",
        price: item.price ?? "",
        imageUrl: item.imageUrl || "",
      }))
    : [{ ...initialMenuItem }];
}

function RestaurantRegistration({
  embedded = false,
  onSubmitted,
  applicationToEdit = null,
}) {
  const { user } = useAuth();
  const MainContainer = embedded ? "section" : "main";

  const [formData, setFormData] = useState(() => getInitialFormData(applicationToEdit, user?.email));

  const [compliance, setCompliance] = useState(() => getInitialCompliance(applicationToEdit));
  const [menu, setMenu] = useState(() => getInitialMenu(applicationToEdit));
  const [documents, setDocuments] = useState(() => applicationToEdit?.documents || []);
  const [documentType, setDocumentType] = useState("fssai_certificate");
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  function handleComplianceChange(event) {
    const { name, value } = event.target;

    setCompliance((current) => ({
      ...current,
      [name]: value,
      ...(name === "gstStatus" && value !== "registered"
        ? { gstin: "" }
        : {}),
    }));

    setError("");
    setSuccess("");
  }

  function handleMenuChange(index, event) {
    const { name, value } = event.target;

    setMenu((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [name]: value }
          : item
      )
    );

    setError("");
    setSuccess("");
  }

  async function handleUpload(event, kind, menuIndex = -1) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 6000000) {
      setError("Each file must be smaller than 6 MB.");
      return;
    }
    const allowed = kind === "document"
      ? ["application/pdf", "image/jpeg", "image/png", "image/webp"]
      : ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError(kind === "document" ? "Choose a PDF, JPG, PNG, or WebP file." : "Choose a JPG, PNG, or WebP image.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Unable to read this file."));
        reader.readAsDataURL(file);
      });
      const response = await api.post("/uploads", {
        kind,
        name: file.name,
        mimeType: file.type,
        data,
      });
      const uploadedFile = response.data.file;
      if (kind === "restaurant_image") {
        setFormData((current) => ({ ...current, imageUrl: uploadedFile.url }));
      } else if (kind === "menu_image") {
        setMenu((current) => current.map((item, index) => index === menuIndex ? { ...item, imageUrl: uploadedFile.url } : item));
      } else {
        setDocuments((current) => [...current, { ...uploadedFile, documentType }]);
      }
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || uploadError.message || "Unable to upload this file.");
    } finally {
      setUploading(false);
    }
  }

  function addMenuItem() {
    setMenu((current) => [
      ...current,
      { ...initialMenuItem },
    ]);
  }

  function removeMenuItem(index) {
    setMenu((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    setError("");
    setSuccess("");

    if (
      applicationToEdit &&
      !["rejected", "approved"].includes(applicationToEdit.status)
    ) {
      setError(
        "This application cannot be edited in its current status."
      );
      return;
    }

    const validMenu = menu.filter(
      (item) =>
        item.name.trim() &&
        item.category.trim() &&
        item.price !== ""
    );

    if (validMenu.length === 0) {
      setError("Please add at least one complete menu item.");
      return;
    }

    if (!/^\d{14}$/.test(compliance.fssaiNumber.trim())) {
      setError("Please enter a valid 14-digit FSSAI number.");
      return;
    }

    if (
      compliance.gstStatus === "registered" &&
      !/^[0-9A-Za-z]{15}$/.test(compliance.gstin.trim())
    ) {
      setError("Please enter a valid 15-character GSTIN.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        documents: documents.map(({ documentType: type, storageKey, originalName, mimeType, sizeBytes }) => ({ documentType: type, storageKey, originalName, mimeType, sizeBytes })),

        compliance: {
          ...compliance,
          fssaiNumber: compliance.fssaiNumber.trim(),
          gstin: compliance.gstin.trim().toUpperCase(),
          fssaiValidUntil: compliance.fssaiValidUntil || null,
        },

        menu: validMenu.map((item) => ({
          category: item.category.trim(),
          name: item.name.trim(),
          description: item.description.trim(),
          price: Number(item.price),
          imageUrl: item.imageUrl.trim(),
        })),
      };

      const response = applicationToEdit?._id
        ? await api.patch(
            applicationToEdit.status === "approved"
              ? `/restaurants/${applicationToEdit._id}`
              : `/restaurants/${applicationToEdit._id}/resubmit`,
            payload
          )
        : await api.post("/restaurants", payload);

      setSuccess(
        applicationToEdit
          ? applicationToEdit.status === "approved"
            ? "Your restaurant information has been updated."
            : "Your corrected application has been resubmitted successfully. It is awaiting admin review."
          : "Your restaurant application has been submitted successfully. It is now awaiting admin approval."
      );

      onSubmitted?.(response.data.restaurant);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to submit your application. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {!embedded && <Navbar />}

      <MainContainer className="restaurant-registration">
        <header className="restaurant-registration-header">
          <p className="restaurant-registration-eyebrow">
            FOODEASE / RESTAURANT PARTNERS
          </p>

          <h1>
            {applicationToEdit?.status === "approved" ? (
              <>Update your menu<br /><span>and daily details.</span></>
            ) : applicationToEdit ? (
              <>
                Refine your application
                <br />
                <span>and try again.</span>
              </>
            ) : (
              <>
                Bring your kitchen
                <br />
                <span>to the table.</span>
              </>
            )}
          </h1>

          <p className="restaurant-registration-intro">
            {applicationToEdit?.status === "approved"
              ? "Update menu items and operating hours. Your approved business details stay protected."
              : applicationToEdit
                ? "Review the saved details, complete any missing information and submit the application for admin approval."
                : "Introduce your restaurant to FoodEase. Provide your restaurant, business and contact details to begin the partnership application process."}
          </p>
        </header>

            {applicationToEdit?.rejectionReason && (
          <div
            className="restaurant-registration-note"
            role="alert"
          >
            <p>PREVIOUS APPLICATION REVIEW</p>
            <p>
              {applicationToEdit.rejectionReason}
            </p>
          </div>
        )}

        <form
          className="restaurant-registration-form"
          onSubmit={handleSubmit}
        >
          {applicationToEdit?.status !== "approved" && <>

          <div className="restaurant-registration-section">
            <p className="restaurant-registration-section-label">
              RESTAURANT DETAILS
            </p>

            <div className="restaurant-registration-grid">
              <label>
                RESTAURANT NAME *
                <input
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  placeholder="Your restaurant name"
                  maxLength={100}
                  required
                />
              </label>

              <label>
                CUISINE *
                <select
                  name="cuisine"
                  value={formData.cuisine}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select cuisine</option>
                  <option value="Indian">Indian</option>
                  <option value="South Indian">South Indian</option>
                  <option value="North Indian">North Indian</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Italian">Italian</option>
                  <option value="Continental">Continental</option>
                  <option value="Cafe">Cafe</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="restaurant-registration-full">
                RESTAURANT ADDRESS *
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Door number, street, area"
                  rows={3}
                  maxLength={500}
                  required
                />
              </label>

              <label>
                LANDMARK
                <input
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleChange}
                  placeholder="Nearby landmark"
                  maxLength={150}
                />
              </label>

              <label>
                POSTAL CODE
                <input
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="641001"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  title="Enter a valid 6-digit Indian postal code"
                />
              </label>

              <label>
                CITY *
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Coimbatore"
                  maxLength={80}
                  required
                />
              </label>

              <label>
                STATE *
                <input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Tamil Nadu"
                  maxLength={80}
                  required
                />
              </label>

              <label className="restaurant-registration-full">
                RESTAURANT IMAGE *
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => handleUpload(event, "restaurant_image")}
                  required={!formData.imageUrl}
                />
                {formData.imageUrl && <span>Image uploaded</span>}
              </label>
              <p className="restaurant-registration-full restaurant-location-help">The restaurant map location is found automatically from this address when you submit it.</p>

              <label className="restaurant-registration-full">
                ABOUT YOUR RESTAURANT
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell customers about your restaurant, food and specialties."
                  rows={4}
                  maxLength={500}
                />
              </label>
            </div>
          </div>

          {/* BUSINESS DETAILS */}

          <div className="restaurant-registration-section">
            <p className="restaurant-registration-section-label">
              BUSINESS DETAILS
            </p>

            <div className="restaurant-registration-grid">
              <label>
                LEGAL BUSINESS NAME
                <input
                  name="legalBusinessName"
                  value={formData.legalBusinessName}
                  onChange={handleChange}
                  placeholder="Registered business name"
                  maxLength={150}
                />
              </label>

              <label>
                BUSINESS TYPE *
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select business type</option>
                  <option value="proprietorship">
                    Sole proprietorship
                  </option>
                  <option value="partnership">
                    Partnership
                  </option>
                  <option value="llp">
                    Limited liability partnership
                  </option>
                  <option value="private_limited">
                    Private limited company
                  </option>
                  <option value="public_limited">
                    Public limited company
                  </option>
                  <option value="trust_society">
                    Trust / Society
                  </option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="restaurant-registration-full">
                BUSINESS REGISTRATION NUMBER
                <input
                  name="businessRegistrationNumber"
                  value={formData.businessRegistrationNumber}
                  onChange={handleChange}
                  placeholder="Registration or incorporation number, if applicable"
                  maxLength={100}
                />
              </label>
            </div>
          </div>

          {/* OWNER DETAILS */}

          <div className="restaurant-registration-section">
            <p className="restaurant-registration-section-label">
              OWNER AND CONTACT DETAILS
            </p>

            <div className="restaurant-registration-grid">
              <label>
                OWNER / AUTHORISED PERSON NAME *
                <input
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="Full legal name"
                  maxLength={100}
                  required
                />
              </label>

              <label>
                DESIGNATION
                <input
                  name="contactDesignation"
                  value={formData.contactDesignation}
                  onChange={handleChange}
                  placeholder="Owner, Manager, Director..."
                  maxLength={80}
                />
              </label>

              <label>
                CONTACT EMAIL *
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  maxLength={254}
                  required
                />
              </label>

              <label>
                PHONE NUMBER *
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Contact number"
                  maxLength={20}
                  required
                />
              </label>
            </div>
          </div>

          {/* FSSAI DETAILS */}

          <div className="restaurant-registration-section">
            <p className="restaurant-registration-section-label">
              FOOD SAFETY AND FSSAI
            </p>

            <div className="restaurant-registration-grid">
              <label>
                FSSAI LICENCE TYPE *
                <select
                  name="fssaiType"
                  value={compliance.fssaiType}
                  onChange={handleComplianceChange}
                  required
                >
                  <option value="">Select FSSAI type</option>
                  <option value="registration">
                    FSSAI Registration
                  </option>
                  <option value="state_license">
                    State Licence
                  </option>
                  <option value="central_license">
                    Central Licence
                  </option>
                </select>
              </label>

              <label>
                FSSAI REGISTRATION / LICENCE NUMBER *
                <input
                  name="fssaiNumber"
                  value={compliance.fssaiNumber}
                  onChange={handleComplianceChange}
                  placeholder="14-digit FSSAI number"
                  maxLength={14}
                  minLength={14}
                  inputMode="numeric"
                  pattern="[0-9]{14}"
                  title="FSSAI number must contain exactly 14 digits"
                  required
                />
              </label>

              <label>
                FSSAI VALID UNTIL *
                <input
                  type="date"
                  name="fssaiValidUntil"
                  value={compliance.fssaiValidUntil}
                  onChange={handleComplianceChange}
                  required
                />
              </label>

              <label>
                SHOP AND ESTABLISHMENT LICENCE NUMBER
                <input
                  name="shopLicenseNumber"
                  value={compliance.shopLicenseNumber}
                  onChange={handleComplianceChange}
                  placeholder="Licence number, if applicable"
                  maxLength={100}
                />
              </label>
            </div>
          </div>

          {/* GST DETAILS */}

          <div className="restaurant-registration-section">
            <p className="restaurant-registration-section-label">
              GST DETAILS
            </p>

            <div className="restaurant-registration-grid">
              <label>
                GST REGISTRATION STATUS *
                <select
                  name="gstStatus"
                  value={compliance.gstStatus}
                  onChange={handleComplianceChange}
                  required
                >
                  <option value="">Select GST status</option>
                  <option value="registered">Registered</option>
                  <option value="not_registered">
                    Not registered
                  </option>
                  <option value="not_applicable">
                    Not applicable
                  </option>
                </select>
              </label>

              {compliance.gstStatus === "registered" && (
                <label>
                  GSTIN *
                  <input
                    name="gstin"
                    value={compliance.gstin}
                    onChange={handleComplianceChange}
                    placeholder="15-character GSTIN"
                    maxLength={15}
                    minLength={15}
                    pattern="[0-9A-Za-z]{15}"
                    title="GSTIN must contain 15 characters"
                    required
                  />
                </label>
              )}

              <p className="restaurant-registration-full restaurant-registration-note">
                GST information is collected according to your business registration status.
              </p>
            </div>
          </div>

          <div className="restaurant-registration-section">
            <p className="restaurant-registration-section-label">SUPPORTING DOCUMENTS</p>
            <div className="restaurant-registration-grid">
              <label>
                DOCUMENT TYPE
                <select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
                  <option value="fssai_certificate">FSSAI CERTIFICATE</option>
                  <option value="gst_certificate">GST CERTIFICATE</option>
                  <option value="pan_card">PAN CARD</option>
                  <option value="shop_license">SHOP LICENCE</option>
                  <option value="premises_proof">PREMISES PROOF</option>
                  <option value="cancelled_cheque">CANCELLED CHEQUE</option>
                  <option value="menu">MENU</option>
                  <option value="other">OTHER</option>
                </select>
              </label>
              <label>
                UPLOAD DOCUMENT
                <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => handleUpload(event, "document")} disabled={uploading} />
              </label>
              <div className="restaurant-registration-full">
                {documents.map((document, index) => <p key={`${document.storageKey}-${index}`}>{document.originalName} · {document.documentType.replaceAll("_", " ").toUpperCase()}</p>)}
                {uploading && <p>UPLOADING FILE...</p>}
              </div>
            </div>
          </div>
          </>}


          <div className="restaurant-registration-section">
            <p className="restaurant-registration-section-label">
              MENU ITEMS
            </p>

            <div className="restaurant-registration-grid">
              {menu.map((item, index) => (
                <div
                  className="restaurant-menu-form-item restaurant-registration-full"
                  key={index}
                >
                  <div className="restaurant-registration-grid">
                    <label>
                      CATEGORY *
                      <input
                        name="category"
                        value={item.category}
                        onChange={(event) =>
                          handleMenuChange(index, event)
                        }
                        placeholder="Main course, starters..."
                        maxLength={80}
                        required
                      />
                    </label>

                    <label>
                      ITEM NAME *
                      <input
                        name="name"
                        value={item.name}
                        onChange={(event) =>
                          handleMenuChange(index, event)
                        }
                        placeholder="Dish name"
                        maxLength={100}
                        required
                      />
                    </label>

                    <label>
                      PRICE (₹) *
                      <input
                        type="number"
                        name="price"
                        value={item.price}
                        onChange={(event) =>
                          handleMenuChange(index, event)
                        }
                        placeholder="150"
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </label>

                    <label className="restaurant-registration-full">
                      ITEM DESCRIPTION
                      <textarea
                        name="description"
                        value={item.description}
                        onChange={(event) =>
                          handleMenuChange(index, event)
                        }
                        placeholder="Describe the dish"
                        rows={2}
                        maxLength={300}
                      />
                    </label>

                    <label className="restaurant-registration-full">
                      ITEM IMAGE
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => handleUpload(event, "menu_image", index)}
                      />
                      {item.imageUrl && <span>Image uploaded</span>}
                    </label>
                  </div>

                  {menu.length > 1 && (
                    <button
                      type="button"
                      className="restaurant-menu-remove"
                      onClick={() => removeMenuItem(index)}
                    >
                      REMOVE ITEM
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="restaurant-menu-add"
                onClick={addMenuItem}
              >
                + ADD MENU ITEM
              </button>
            </div>
          </div>

          {/* OPERATING HOURS */}

          <div className="restaurant-registration-section">
            <p className="restaurant-registration-section-label">
              OPERATING HOURS
            </p>

            <div className="restaurant-registration-grid">
              <label>
                OPENING TIME *
                <input
                  type="time"
                  name="openingTime"
                  value={formData.openingTime}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                CLOSING TIME *
                <input
                  type="time"
                  name="closingTime"
                  value={formData.closingTime}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>
          </div>

          {/* SUBMISSION */}

          <div className="restaurant-registration-submit">
            <div>
              {error && (
                <p role="alert" aria-live="polite">
                  {error}
                </p>
              )}

              {success && (
                <p role="status" aria-live="polite">
                  {success}
                </p>
              )}

              {!success && !error && (
                <p>
                  {applicationToEdit?.status === "approved"
                    ? "Only menu items and operating hours can be changed after approval."
                    : applicationToEdit
                      ? "Your corrected application will be reviewed again by the FoodEase admin team."
                    : "Your application will be reviewed by the FoodEase admin team. Your restaurant will not appear in the public restaurant listings until it is approved."}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || Boolean(success)}
            >
              {submitting
                ? applicationToEdit && applicationToEdit.status !== "approved"
                  ? "RESUBMITTING APPLICATION..."
                  : "SUBMITTING APPLICATION..."
                  : success
                  ? applicationToEdit?.status === "approved" ? "CHANGES SAVED" : "APPLICATION SUBMITTED"
                  : applicationToEdit && applicationToEdit.status !== "approved"
                    ? "RESUBMIT APPLICATION"
                    : applicationToEdit
                      ? "SAVE RESTAURANT CHANGES"
                      : "SUBMIT APPLICATION"}

              <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>

        <footer className="restaurant-registration-footer">
          <span>FOOD / PEOPLE / PLACES</span>

          {embedded ? (
            <span>{user?.username}</span>
          ) : (
            <Link to="/restaurant-dashboard">
              BACK TO DASHBOARD <span>↗</span>
            </Link>
          )}
        </footer>
      </MainContainer>
    </>
  );
}

export default RestaurantRegistration;
