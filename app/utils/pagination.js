const getPagination = ({ array, page, limit }) => {
  if (page && limit) {
    const first = (Number(page) - 1) * Number(limit);
    const end = first + limit;
    return array.slice(first, end);
  }
  return array;
};

module.exports = {
  getPagination,
};
